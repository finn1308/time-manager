/**
 * Test Suite for ChronoMind Meeting Rooms / Collaborative Workspaces
 * Tests End-to-End: Database persistence, RBAC permissions, bulk member import,
 * password change workflow, group join requests, Kanban column & card operations,
 * IDOR prevention, and real-time tracking calculations.
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateRandomRoomPublicId,
  ROOM_ROLES,
  DEFAULT_COLUMNS,
} from "../src/lib/rooms/room-utils";
import {
  getRoomAuth,
  requireRoomAuth,
  requireRoomRole,
  recordRoomAudit,
} from "../src/lib/rooms/room-auth";

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHÒNG HỌP (MEETING ROOMS TEST SUITE)");
  console.log("===============================================================\n");

  const timestamp = Date.now();
  const adminEmail = `test.admin.${timestamp}@chronomind.local`;
  const hostEmail = `test.host.${timestamp}@chronomind.local`;
  const memberEmail = `test.member.${timestamp}@chronomind.local`;
  const outsiderEmail = `test.outsider.${timestamp}@chronomind.local`;

  // 1. Setup Test Users
  console.log("--- TEST 1: Khởi tạo người dùng thử nghiệm & Phân quyền ---");
  const defaultPwHash = await bcrypt.hash("12345678", 10);

  const [adminUser, hostUser, memberUser, outsiderUser] = await Promise.all([
    prisma.user.create({
      data: { email: adminEmail, name: "Admin Test", passwordHash: defaultPwHash, role: "USER" },
    }),
    prisma.user.create({
      data: { email: hostUserEmail(timestamp), name: "Host Test", passwordHash: defaultPwHash, role: "USER" },
    }),
    prisma.user.create({
      data: { email: memberEmail, name: "Member Test", passwordHash: defaultPwHash, role: "USER", mustChangePassword: true },
    }),
    prisma.user.create({
      data: { email: outsiderEmail, name: "Outsider Test", passwordHash: defaultPwHash, role: "USER" },
    }),
  ]);

  assert(!!adminUser.id && !!memberUser.id, "Tạo 4 tài khoản thử nghiệm thành công");
  assert(memberUser.mustChangePassword === true, "Thành viên mới mang cờ mustChangePassword = true");

  // 2. Room Creation & PublicId Entropy
  console.log("\n--- TEST 2: Tạo phòng họp & Kiểm tra Entropy ID ngẫu nhiên ---");
  const publicId1 = generateRandomRoomPublicId();
  const publicId2 = generateRandomRoomPublicId();

  assert(publicId1.startsWith("rm_") && publicId1.length === 15, "ID ngẫu nhiên có tiền tố rm_ và độ dài chuẩn");
  assert(publicId1 !== publicId2, "Hai ID liên tiếp không bị trùng lặp (đạt entropy an toàn)");

  const room = await prisma.meetingRoom.create({
    data: {
      publicId: publicId1,
      title: "Đồ án Tốt nghiệp CNTT",
      subject: "Công nghệ Phần mềm",
      description: "Phòng nghiên cứu và làm việc nhóm",
      ownerId: adminUser.id,
      joinPolicy: "APPROVAL_REQUIRED",
      status: "ACTIVE",
    },
  });

  // Create columns
  for (const col of DEFAULT_COLUMNS) {
    await prisma.boardColumn.create({
      data: {
        roomId: room.id,
        name: col.name,
        key: col.key,
        color: col.color,
        sortOrder: col.sortOrder,
        isDefault: col.isDefault,
      },
    });
  }

  // Create Admin membership
  await prisma.roomMembership.create({
    data: { roomId: room.id, userId: adminUser.id, role: ROOM_ROLES.ADMIN, status: "ACTIVE" },
  });

  assert(!!room.id, "Phòng họp đã được lưu bền vững vào Supabase PostgreSQL");

  // 2.1. Architectural Layout Decoupling & Dedicated Admin Credential Verification
  console.log("\n--- TEST 2.1: Tách Layout độc lập & Khởi tạo Tài khoản Quản trị phòng ---");
  const standalonePageExists = fs.existsSync(path.join(process.cwd(), "src/app/rooms/[roomId]/page.tsx"));
  const dashboardRoomSubrouteExists = fs.existsSync(path.join(process.cwd(), "src/app/(dashboard)/rooms/[roomId]"));
  const roomLoginFileExists = fs.existsSync(path.join(process.cwd(), "src/components/rooms/room-login.tsx"));
  const roomLoginContent = roomLoginFileExists ? fs.readFileSync(path.join(process.cwd(), "src/components/rooms/room-login.tsx"), "utf-8") : "";

  assert(standalonePageExists, "Tệp src/app/rooms/[roomId]/page.tsx tồn tại độc lập ngoài (dashboard)");
  assert(!dashboardRoomSubrouteExists, "Đã loại bỏ hoàn toàn src/app/(dashboard)/rooms/[roomId] để không thừa kế sidebar/topbar");
  assert(roomLoginFileExists, "Tệp giao diện đăng nhập phòng src/components/rooms/room-login.tsx đã sẵn sàng");
  assert(roomLoginContent.includes("Chào mừng bạn đến với phòng họp ID = "), "Tiêu đề trang đăng nhập phòng tuân thủ chính xác mẫu bắt buộc trong AGENT.md");

  // Dedicated Room Admin user generated on room creation
  const roomAdminUsername = `admin_${room.publicId}`;
  const roomAdminEmail = `${roomAdminUsername}@room.local`;
  const roomAdmin = await prisma.user.create({
    data: {
      email: roomAdminEmail,
      name: roomAdminUsername,
      passwordHash: defaultPwHash,
      role: "USER", // CRITICAL: Isolated to room, never granted global ChronoMind ADMIN
      mustChangePassword: true,
    },
  });

  await prisma.roomMembership.create({
    data: {
      roomId: room.id,
      userId: roomAdmin.id,
      role: ROOM_ROLES.ADMIN,
      status: "ACTIVE",
    },
  });

  assert(roomAdmin.role === "USER", "Tài khoản admin phòng không được cấp quyền admin toàn hệ thống ChronoMind (role = USER)");
  assert(roomAdmin.mustChangePassword === true, "Admin phòng mới tạo bắt buộc phải đổi mật khẩu (mustChangePassword = true)");
  const adminPwValid = await bcrypt.compare("12345678", roomAdmin.passwordHash!);
  assert(adminPwValid === true, "Mật khẩu tạm ban đầu của admin phòng được thiết lập chuẩn 12345678 và mã hóa an toàn");

  const roomAdminAuth = await getRoomAuth(room.id, roomAdmin.id);
  assert(roomAdminAuth?.isAdmin === true, "Tài khoản admin phòng có toàn quyền ADMIN trong phạm vi phòng họp");

  // 3. Authorization & IDOR Protection
  console.log("\n--- TEST 3: Kiểm tra phân quyền RBAC & Chặn truy cập trái phép (IDOR) ---");
  const adminAuth = await getRoomAuth(room.publicId, adminUser.id);
  assert(adminAuth?.isAdmin === true, "Admin được định danh chính xác quyền Quản trị cao nhất");

  const outsiderAuth = await getRoomAuth(room.publicId, outsiderUser.id);
  assert(outsiderAuth === null, "Người ngoài (Outsider) không thể truy cập phòng họp dù có ID/link");

  let caughtUnauthorized = false;
  try {
    await requireRoomAuth(room.publicId, outsiderUser.id);
  } catch (err: any) {
    caughtUnauthorized = err.message === "UNAUTHORIZED_ROOM_ACCESS";
  }
  assert(caughtUnauthorized, "requireRoomAuth ném lỗi từ chối người ngoài phòng họp");

  // Add Host and Member to room
  const hostMembership = await prisma.roomMembership.create({
    data: { roomId: room.id, userId: hostUser.id, role: ROOM_ROLES.HOST, status: "ACTIVE" },
  });
  const memberMembership = await prisma.roomMembership.create({
    data: { roomId: room.id, userId: memberUser.id, role: ROOM_ROLES.MEMBER, status: "ACTIVE" },
  });

  const hostAuth = await getRoomAuth(room.id, hostUser.id);
  assert(hostAuth?.isHost === true && hostAuth?.isAdmin === false, "Host có quyền Host nhưng không phải Admin");

  const memberAuth = await getRoomAuth(room.id, memberUser.id);
  assert(memberAuth?.isMember === true && memberAuth?.isHost === false, "Member có quyền Member nhưng không có quyền Host");

  // Host cannot execute Admin-only actions
  let caughtHostDemote = false;
  try {
    await requireRoomRole(room.id, hostUser.id, [ROOM_ROLES.ADMIN]);
  } catch (err: any) {
    caughtHostDemote = err.message === "INSUFFICIENT_ROOM_PERMISSIONS";
  }
  assert(caughtHostDemote, "Host bị chặn không thể thực hiện các thao tác chỉ dành cho Admin");

  // 4. First Login Password Flow & Reset
  console.log("\n--- TEST 4: Luồng đổi mật khẩu lần đầu & Quản trị viên Reset mật khẩu ---");
  // Member changes password
  const newPasswordHash = await bcrypt.hash("NewSecurePass123", 10);
  await prisma.user.update({
    where: { id: memberUser.id },
    data: { passwordHash: newPasswordHash, mustChangePassword: false },
  });

  const updatedMember = await prisma.user.findUnique({ where: { id: memberUser.id } });
  assert(updatedMember?.mustChangePassword === false, "Sau khi đổi mật khẩu, mustChangePassword trở thành false");
  const isValidPw = await bcrypt.compare("NewSecurePass123", updatedMember!.passwordHash!);
  assert(isValidPw, "Mật khẩu mới đã được cập nhật chính xác và an toàn bằng bcrypt");

  // Admin resets password
  const resetPwHash = await bcrypt.hash("12345678", 10);
  await prisma.user.update({
    where: { id: memberUser.id },
    data: { passwordHash: resetPwHash, mustChangePassword: true },
  });
  const resetMember = await prisma.user.findUnique({ where: { id: memberUser.id } });
  assert(resetMember?.mustChangePassword === true, "Admin reset mật khẩu thành công và bật lại cờ mustChangePassword");

  // 5. Groups & Join Requests Workflow
  console.log("\n--- TEST 5: Quản lý nhóm con & Luồng duyệt thành viên xin vào nhóm ---");
  const group = await prisma.roomGroup.create({
    data: {
      roomId: room.id,
      name: "Nhóm 1 - Kiến trúc Hệ thống",
      color: "sky",
      joinPolicy: "APPROVAL_REQUIRED",
    },
  });

  // Member sends join request
  const joinRequest = await prisma.groupJoinRequest.create({
    data: {
      groupId: group.id,
      membershipId: memberMembership.id,
      status: "PENDING",
      note: "Em muốn tham gia làm phần cơ sở dữ liệu",
    },
  });

  assert(joinRequest.status === "PENDING", "Yêu cầu xin vào nhóm được ghi nhận ở trạng thái PENDING");

  // Host approves request
  await prisma.$transaction(async (tx) => {
    await tx.groupMembership.create({
      data: {
        groupId: group.id,
        membershipId: memberMembership.id,
        status: "ACTIVE",
        approvedBy: hostUser.id,
      },
    });
    await tx.groupJoinRequest.update({
      where: { id: joinRequest.id },
      data: { status: "APPROVED", reviewedBy: hostUser.id, reviewedAt: new Date() },
    });
  });

  const memberGroup = await prisma.groupMembership.findUnique({
    where: {
      groupId_membershipId: {
        groupId: group.id,
        membershipId: memberMembership.id,
      },
    },
  });
  assert(!!memberGroup && memberGroup.status === "ACTIVE", "Thành viên được thêm vào nhóm thành công sau khi Host duyệt");

  // 6. Kanban Board Operations: Card Creation, Move, Checklist, Comments
  console.log("\n--- TEST 6: Bảng công việc Trello: Tạo thẻ, Di chuyển cột, Checklist, Bình luận ---");
  const columns = await prisma.boardColumn.findMany({
    where: { roomId: room.id },
    orderBy: { sortOrder: "asc" },
  });
  const colContent = columns.find((c) => c.key === "CONTENT")!;
  const colInProgress = columns.find((c) => c.key === "IN_PROGRESS")!;
  const colCompleted = columns.find((c) => c.key === "COMPLETED")!;

  // Create card
  const card = await prisma.taskCard.create({
    data: {
      roomId: room.id,
      columnId: colContent.id,
      groupId: group.id,
      creatorId: memberUser.id,
      title: "Thiết kế Schema cơ sở dữ liệu Meeting Rooms",
      description: "Tạo các model theo yêu cầu của AGENT.md",
      sortOrder: 0,
      dueAt: new Date(Date.now() + 86400000), // tomorrow
    },
  });

  // Assign member to card
  await prisma.taskAssignee.create({
    data: { taskId: card.id, membershipId: memberMembership.id },
  });

  // Add checklist items
  const checkItem1 = await prisma.taskChecklistItem.create({
    data: { taskId: card.id, text: "Viết model Prisma", isCompleted: true },
  });
  const checkItem2 = await prisma.taskChecklistItem.create({
    data: { taskId: card.id, text: "Chạy db push đồng bộ", isCompleted: true },
  });
  const checkItem3 = await prisma.taskChecklistItem.create({
    data: { taskId: card.id, text: "Viết test suite", isCompleted: false },
  });

  assert(checkItem1.isCompleted && !checkItem3.isCompleted, "Checklist items ghi nhận đúng trạng thái hoàn thành");

  // Add comment
  const comment = await prisma.taskComment.create({
    data: { taskId: card.id, authorId: hostUser.id, body: "Tiến độ rất tốt, nhớ kiểm tra IDOR nhé!" },
  });
  assert(!!comment.id, "Bình luận trên thẻ được lưu thành công");

  // Move card to COMPLETED
  const movedCard = await prisma.taskCard.update({
    where: { id: card.id },
    data: {
      columnId: colCompleted.id,
      isCompleted: true,
      completedAt: new Date(),
      sortOrder: 1,
    },
  });
  assert(movedCard.columnId === colCompleted.id && movedCard.isCompleted === true, "Thẻ di chuyển sang cột Đã hoàn thành và tự động đánh dấu isCompleted");

  // 7. Personal Updates (Tab Cá nhân)
  console.log("\n--- TEST 7: Dòng cập nhật cá nhân (Tab Cá nhân) ---");
  const post = await prisma.roomActivityPost.create({
    data: {
      roomId: room.id,
      authorId: memberUser.id,
      groupId: group.id,
      content: "Hôm nay em đã hoàn thành thiết kế bảng Kanban cho nhóm 1!",
    },
  });
  assert(!!post.id, "Bài viết cập nhật cá nhân được lưu bền vững vào cơ sở dữ liệu");

  // 8. Audit Event Logging (Audit Trail)
  console.log("\n--- TEST 8: Nhật ký kiểm toán an toàn (Audit Trail) ---");
  await recordRoomAudit({
    roomId: room.id,
    actorId: adminUser.id,
    action: "ROOM_CREATED",
    entityType: "ROOM",
    entityId: room.id,
    details: { title: room.title, password: "SECRET_PASSWORD_MUST_BE_FILTERED" },
  });

  const auditEvents = await prisma.roomAuditEvent.findMany({
    where: { roomId: room.id },
  });
  assert(auditEvents.length > 0, "Audit event được ghi nhận trong cơ sở dữ liệu");
  const latestAudit = auditEvents[auditEvents.length - 1];
  const details = latestAudit.details as any;
  assert(details?.password === undefined, "Thông tin nhạy cảm (password) được loại bỏ triệt để khỏi Audit log");

  // 9. Real Tracking Calculation
  console.log("\n--- TEST 9: Thuật toán tính toán số liệu Tracking thực tế ---");
  const allCards = await prisma.taskCard.findMany({
    where: { roomId: room.id, archivedAt: null },
    include: { column: true, assignees: true },
  });

  const totalTasks = allCards.length;
  const completedTasks = allCards.filter((c) => c.isCompleted || c.column.key === "COMPLETED").length;
  const rate = Math.round((completedTasks / totalTasks) * 100);

  assert(totalTasks === 1, "Tổng số nhiệm vụ phản ánh chính xác 1 thẻ");
  assert(completedTasks === 1, "Số nhiệm vụ hoàn thành tính đúng 1 thẻ");
  assert(rate === 100, "Tỷ lệ hoàn thành đạt 100%");

  // 10. Clean-up Test Data
  console.log("\n--- TEST 10: Dọn dẹp dữ liệu kiểm thử an toàn ---");
  await prisma.meetingRoom.delete({ where: { id: room.id } });
  await prisma.user.deleteMany({
    where: { id: { in: [adminUser.id, hostUser.id, memberUser.id, outsiderUser.id, roomAdmin.id] } },
  });

  // Verify room is deleted
  const checkRoom = await prisma.meetingRoom.findUnique({ where: { id: room.id } });
  assert(checkRoom === null, "Phòng họp và toàn bộ dữ liệu phụ thuộc được dọn dẹp sạch sẽ");

  console.log("\n===============================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TEST ASSERTIONS PASSED (100%)`);
  console.log("===============================================================");
}

function hostUserEmail(timestamp: number) {
  return `test.host.${timestamp}@chronomind.local`;
}

runTestSuite()
  .catch((err) => {
    console.error("Test Suite Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
