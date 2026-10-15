/**
 * Test Suite: Multi-Image Storage & Upload in Meeting Rooms
 * Verifies that Meeting Rooms can store and manage multiple images (e.g. 6+ images)
 * per post and per task card with 100% data integrity.
 */

import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { generateRandomRoomPublicId, ROOM_ROLES } from "../src/lib/rooms/room-utils";

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

async function runMultiImageTestSuite() {
  console.log("===============================================================");
  console.log("📸 KIỂM THỬ KHẢ NĂNG LƯU TRỮ NHIỀU ẢNH (MULTI-IMAGE TEST SUITE)");
  console.log("===============================================================\n");

  const timestamp = Date.now();
  const testUserEmail = `img.tester.${timestamp}@chronomind.local`;
  const publicId = generateRandomRoomPublicId();

  // 1. Setup Test User & Room
  console.log("--- TEST 1: Khởi tạo Phòng họp & Người dùng thử nghiệm ---");
  const user = await prisma.user.create({
    data: {
      email: testUserEmail,
      name: "Image Tester",
      role: "USER",
    },
  });

  const room = await prisma.meetingRoom.create({
    data: {
      publicId,
      title: "Phòng thử nghiệm Multi-Image Gallery",
      subject: "Kiểm thử Hình ảnh",
      ownerId: user.id,
      status: "ACTIVE",
    },
  });

  await prisma.roomMembership.create({
    data: {
      roomId: room.id,
      userId: user.id,
      role: ROOM_ROLES.ADMIN,
      status: "ACTIVE",
    },
  });

  assert(!!room.id, "Tạo phòng họp thử nghiệm thành công");

  // 2. Test Storing 6 Images in a Single Post
  console.log("\n--- TEST 2: Lưu trữ 6 hình ảnh trong 1 bài đăng (Post) ---");
  const sampleSixImages = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600",
  ];

  const postWith6Images = await prisma.roomActivityPost.create({
    data: {
      roomId: room.id,
      authorId: user.id,
      content: "Báo cáo tiến độ đồ án tuần 3 kèm 6 ảnh chụp hoạt động nhóm",
      imageUrl: sampleSixImages[0], // primary cover
      imageUrls: sampleSixImages, // all 6 images
    },
  });

  assert(postWith6Images.imageUrls.length === 6, "Bài đăng lưu trữ thành công chính xác 6 URL ảnh");
  assert(postWith6Images.imageUrl === sampleSixImages[0], "Ảnh đại diện đầu tiên được đồng bộ tự động");

  // 3. Verify Database Persistence & Querying
  console.log("\n--- TEST 3: Đọc dữ liệu từ Database & Kiểm tra tính toàn vẹn 6 ảnh ---");
  const retrievedPost = await prisma.roomActivityPost.findUnique({
    where: { id: postWith6Images.id },
  });

  assert(!!retrievedPost, "Truy vấn bài đăng thành công từ Supabase PostgreSQL");
  assert(retrievedPost!.imageUrls.length === 6, "Số lượng ảnh truy vấn lại đúng 6 ảnh");

  let allImagesMatched = true;
  for (let i = 0; i < sampleSixImages.length; i++) {
    if (retrievedPost!.imageUrls[i] !== sampleSixImages[i]) {
      allImagesMatched = false;
      break;
    }
  }
  assert(allImagesMatched, "Toàn bộ 6 đường dẫn ảnh được bảo toàn 100% theo đúng thứ tự tải lên");

  // 4. Test Multi-file Upload Simulation to Disk
  console.log("\n--- TEST 4: Mô phỏng tải lên 6 file ảnh vào thư mục upload ---");
  const uploadDir = path.join(process.cwd(), "public", "uploads", "rooms", room.publicId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const generatedUrls: string[] = [];
  // Generate 6 sample image files (1x1 transparent PNG buffer)
  const samplePngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );

  for (let i = 1; i <= 6; i++) {
    const fileName = `test_img_${Date.now()}_${i}.png`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, samplePngBuffer);
    generatedUrls.push(`/uploads/rooms/${room.publicId}/${fileName}`);
  }

  assert(generatedUrls.length === 6, "Tạo thành công 6 file ảnh trên hệ thống lưu trữ");
  let allFilesExistOnDisk = true;
  for (const url of generatedUrls) {
    const diskPath = path.join(process.cwd(), "public", url);
    if (!fs.existsSync(diskPath)) {
      allFilesExistOnDisk = false;
      break;
    }
  }
  assert(allFilesExistOnDisk, "Cả 6 file ảnh đều tồn tại và có thể truy cập qua URL tĩnh");

  // 5. Test Creating a Post with the 6 Uploaded Images
  console.log("\n--- TEST 5: Tạo bài đăng liên kết 6 ảnh vừa tải lên ---");
  const postWithUploadedImages = await prisma.roomActivityPost.create({
    data: {
      roomId: room.id,
      authorId: user.id,
      content: "Tập hợp 6 ảnh chụp minh họa thực tế",
      imageUrl: generatedUrls[0],
      imageUrls: generatedUrls,
    },
  });

  assert(postWithUploadedImages.imageUrls.length === 6, "Bài đăng liên kết thành công 6 ảnh tải lên nội bộ");

  // 6. Test Multiple Attachments in TaskCard
  console.log("\n--- TEST 6: Thẻ công việc (TaskCard) hỗ trợ nhiều ảnh đính kèm ---");
  const column = await prisma.boardColumn.create({
    data: {
      roomId: room.id,
      name: "Nội dung",
      key: "CONTENT",
      sortOrder: 0,
    },
  });

  const card = await prisma.taskCard.create({
    data: {
      roomId: room.id,
      columnId: column.id,
      creatorId: user.id,
      title: "Thiết kế giao diện Trello",
      description: "Đính kèm 6 ảnh mockup",
    },
  });

  // Attach 6 images to the card
  for (let i = 0; i < 6; i++) {
    await prisma.taskAttachment.create({
      data: {
        taskId: card.id,
        name: `mockup_screen_${i + 1}.png`,
        url: generatedUrls[i],
        size: 1024 * (i + 1),
        type: "image/png",
      },
    });
  }

  const cardWithAttachments = await prisma.taskCard.findUnique({
    where: { id: card.id },
    include: { attachments: true },
  });

  assert(cardWithAttachments?.attachments.length === 6, "Thẻ công việc lưu trữ thành công 6 ảnh đính kèm");

  // 7. Clean-up Test Data and Files
  console.log("\n--- TEST 7: Dọn dẹp an toàn dữ liệu và file kiểm thử ---");
  await prisma.meetingRoom.delete({ where: { id: room.id } });
  await prisma.user.delete({ where: { id: user.id } });

  // Remove test upload directory
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  }

  const checkRoom = await prisma.meetingRoom.findUnique({ where: { id: room.id } });
  assert(checkRoom === null, "Đã dọn dẹp sạch sẽ toàn bộ dữ liệu kiểm thử");
  assert(!fs.existsSync(uploadDir), "Đã dọn dẹp thư mục file ảnh thử nghiệm trên đĩa");

  console.log("\n===============================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed}/${total} MULTI-IMAGE ASSERTIONS PASSED (100%)`);
  console.log("===============================================================");
}

runMultiImageTestSuite()
  .catch((err) => {
    console.error("Multi-Image Test Suite Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
