"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Code2,
  Award,
  Layers,
  Plus,
  ExternalLink,
  Github,
  Calendar,
  Building,
  DollarSign,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Trash2,
  Sparkles,
  Tag,
  Star,
  RefreshCw,
  FolderGit2,
} from "lucide-react";

interface SkillData {
  id: string;
  name: string;
  category: string;
  level: string;
  description: string | null;
  projects: Array<{
    project: {
      id: string;
      title: string;
      status: string;
    };
  }>;
}

interface ProjectData {
  id: string;
  title: string;
  description: string | null;
  repositoryUrl: string | null;
  demoUrl: string | null;
  technologies: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  subject: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  skills: Array<{
    skill: {
      id: string;
      name: string;
      category: string;
      level: string;
    };
  }>;
}

interface CertificateData {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  score: string | null;
  status: string;
}

interface CareerApplicationData {
  id: string;
  company: string;
  role: string;
  location: string | null;
  type: string;
  status: string;
  appliedDate: string | null;
  deadline: string | null;
  salary: string | null;
  notes: string | null;
  jobUrl: string | null;
  resumeUrl: string | null;
}

export default function CareerHubPage() {
  const [activeTab, setActiveTab] = useState<"projects" | "skills" | "certificates" | "internships">("projects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [skills, setSkills] = useState<SkillData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [applications, setApplications] = useState<CareerApplicationData[]>([]);

  // Modals state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showAddAppModal, setShowAddAppModal] = useState(false);

  // Form states
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projRepo, setProjRepo] = useState("");
  const [projDemo, setProjDemo] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projStatus, setProjStatus] = useState("IN_PROGRESS");
  const [projSkillIds, setProjSkillIds] = useState<string[]>([]);

  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("TECH");
  const [skillLevel, setSkillLevel] = useState("INTERMEDIATE");
  const [skillDesc, setSkillDesc] = useState("");

  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certId, setCertId] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [certScore, setCertScore] = useState("");

  const [appCompany, setAppCompany] = useState("");
  const [appRole, setAppRole] = useState("");
  const [appLocation, setAppLocation] = useState("");
  const [appType, setAppType] = useState("INTERNSHIP");
  const [appStatus, setAppStatus] = useState("APPLIED");
  const [appSalary, setAppSalary] = useState("");
  const [appNotes, setAppNotes] = useState("");

  const fetchCareerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [skillsRes, projectsRes, certsRes, appsRes] = await Promise.all([
        fetch("/api/career/skills"),
        fetch("/api/career/projects"),
        fetch("/api/career/certificates"),
        fetch("/api/career/applications"),
      ]);

      const [skillsJson, projectsJson, certsJson, appsJson] = await Promise.all([
        skillsRes.json(),
        projectsRes.json(),
        certsRes.json(),
        appsRes.json(),
      ]);

      if (!skillsRes.ok) throw new Error(skillsJson.error || "Lỗi tải kỹ năng");
      if (!projectsRes.ok) throw new Error(projectsJson.error || "Lỗi tải dự án");
      if (!certsRes.ok) throw new Error(certsJson.error || "Lỗi tải chứng chỉ");
      if (!appsRes.ok) throw new Error(appsJson.error || "Lỗi tải đơn ứng tuyển");

      setSkills(skillsJson.skills || []);
      setProjects(projectsJson.projects || []);
      setCertificates(certsJson.certificates || []);
      setApplications(appsJson.applications || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi tải hồ sơ nghề nghiệp");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCareerData();
  }, [fetchCareerData]);

  // Handler: Add Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    try {
      const res = await fetch("/api/career/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projTitle.trim(),
          description: projDesc.trim() || null,
          repositoryUrl: projRepo.trim() || null,
          demoUrl: projDemo.trim() || null,
          technologies: projTech.trim() || null,
          status: projStatus,
          skillIds: projSkillIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddProjectModal(false);
      setProjTitle("");
      setProjDesc("");
      setProjRepo("");
      setProjDemo("");
      setProjTech("");
      setProjSkillIds([]);
      await fetchCareerData();
    } catch (err: any) {
      alert("Lỗi tạo dự án: " + err.message);
    }
  };

  // Handler: Add Skill
  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;

    try {
      const res = await fetch("/api/career/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: skillName.trim(),
          category: skillCategory,
          level: skillLevel,
          description: skillDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddSkillModal(false);
      setSkillName("");
      setSkillDesc("");
      await fetchCareerData();
    } catch (err: any) {
      alert("Lỗi tạo kỹ năng: " + err.message);
    }
  };

  // Handler: Add Certificate
  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim() || !certIssuer.trim()) return;

    try {
      const res = await fetch("/api/career/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: certName.trim(),
          issuer: certIssuer.trim(),
          issueDate: certDate || new Date().toISOString(),
          credentialId: certId.trim() || null,
          credentialUrl: certUrl.trim() || null,
          score: certScore.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddCertModal(false);
      setCertName("");
      setCertIssuer("");
      setCertDate("");
      setCertId("");
      setCertUrl("");
      setCertScore("");
      await fetchCareerData();
    } catch (err: any) {
      alert("Lỗi tạo chứng chỉ: " + err.message);
    }
  };

  // Handler: Add Career Application
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appCompany.trim() || !appRole.trim()) return;

    try {
      const res = await fetch("/api/career/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: appCompany.trim(),
          role: appRole.trim(),
          location: appLocation.trim() || null,
          type: appType,
          status: appStatus,
          salary: appSalary.trim() || null,
          notes: appNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddAppModal(false);
      setAppCompany("");
      setAppRole("");
      setAppLocation("");
      setAppSalary("");
      setAppNotes("");
      await fetchCareerData();
    } catch (err: any) {
      alert("Lỗi tạo đơn ứng tuyển: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#2d6a4f] animate-spin" />
        <p className="text-sm font-medium text-[#526b5c] dark:text-[#a3bda9]">
          Đang tải hồ sơ năng lực & nghề nghiệp...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Career & Portfolio OS Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-6 sm:p-8 shadow-xl shadow-[#1b4332]/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-[#d8f3dc]">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Career & Portfolio Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hồ sơ Năng lực & Nghề nghiệp
            </h1>
            <p className="text-xs sm:text-sm text-[#d8f3dc]/90 max-w-xl">
              Xây dựng portfolio, tích lũy kỹ năng thực chiến, chứng chỉ quốc tế và quản lý lộ trình
              thực tập xuyên suốt 4 năm đại học.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
            <div>
              <span className="text-[10px] text-[#d8f3dc]/80 uppercase font-semibold">Dự án</span>
              <p className="text-xl font-extrabold">{projects.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#d8f3dc]/80 uppercase font-semibold">Kỹ năng</span>
              <p className="text-xl font-extrabold">{skills.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#d8f3dc]/80 uppercase font-semibold">Chứng chỉ</span>
              <p className="text-xl font-extrabold">{certificates.length}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#d8f3dc]/80 uppercase font-semibold">Ứng tuyển</span>
              <p className="text-xl font-extrabold">{applications.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-[#dbe7dd] dark:border-[#263d2e] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "projects"
              ? "bg-[#2d6a4f] text-white shadow-sm"
              : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#ebf4ee] dark:hover:bg-[#18281d]"
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Dự án & Portfolio ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("skills")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "skills"
              ? "bg-[#2d6a4f] text-white shadow-sm"
              : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#ebf4ee] dark:hover:bg-[#18281d]"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Ma trận Kỹ năng ({skills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("certificates")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "certificates"
              ? "bg-[#2d6a4f] text-white shadow-sm"
              : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#ebf4ee] dark:hover:bg-[#18281d]"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Chứng chỉ ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("internships")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === "internships"
              ? "bg-[#2d6a4f] text-white shadow-sm"
              : "text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#ebf4ee] dark:hover:bg-[#18281d]"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Thực tập & Tuyển dụng ({applications.length})</span>
        </button>
      </div>

      {/* TAB 1: PROJECTS & PORTFOLIO */}
      {activeTab === "projects" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Dự án cá nhân & Môn học
              </h2>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Liên kết bài tập lớn, nghiên cứu khoa học và sản phẩm thực chiến vào portfolio.
              </p>
            </div>
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dự án mới</span>
            </button>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white dark:bg-[#142318] p-5 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          proj.status === "FEATURED"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : proj.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {proj.status === "FEATURED" ? "★ Tiêu biểu" : proj.status === "COMPLETED" ? "Hoàn thành" : "Đang làm"}
                      </span>

                      {proj.subject && (
                        <span className="text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9] truncate max-w-[120px]">
                          {proj.subject.code || proj.subject.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-[#192e22] dark:text-[#f0f7f2] mb-1.5">
                      {proj.title}
                    </h3>

                    {proj.description && (
                      <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] line-clamp-3 leading-relaxed mb-3">
                        {proj.description}
                      </p>
                    )}

                    {proj.technologies && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {proj.technologies.split(",").map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#f8fbf8] dark:bg-[#1a2d20] border border-[#dbe7dd]/60 dark:border-[#263d2e] text-[#2d6a4f] dark:text-[#74c69d]"
                          >
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#dbe7dd]/70 dark:border-[#263d2e] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {proj.repositoryUrl && (
                        <a
                          href={proj.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                          title="Source Code"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {proj.demoUrl && (
                        <a
                          href={proj.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-[#526b5c] dark:text-[#a3bda9] hover:text-[#2d6a4f] dark:hover:text-[#52b788] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                          title="Live Demo"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <span className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">
                      {proj.skills.length > 0 ? `${proj.skills.length} kỹ năng áp dụng` : "Chưa gắn tag"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#142318] rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] p-6 space-y-3">
              <FolderGit2 className="w-10 h-10 text-[#2d6a4f] mx-auto opacity-60" />
              <h3 className="font-bold text-base">Chưa có dự án nào trong portfolio</h3>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-sm mx-auto">
                Lưu lại các bài tập lớn, sản phẩm lập trình hoặc nghiên cứu của bạn để chuẩn bị cho CV thực tập.
              </p>
              <button
                onClick={() => setShowAddProjectModal(true)}
                className="px-4 py-2 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dự án đầu tiên</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SKILLS MATRIX */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Ma trận Kỹ năng (Skills Matrix)
              </h2>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Theo dõi sự tiến bộ từ mức Cơ bản (Beginner) đến Chuyên gia (Expert).
              </p>
            </div>
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm kỹ năng</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="bg-white dark:bg-[#142318] p-4 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                      {skill.name}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ebf4ee] dark:bg-[#1e3425] text-[#2d6a4f] dark:text-[#74c69d] font-semibold">
                      {skill.category}
                    </span>
                  </div>
                  <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-0.5 block">
                    Cấp độ: <strong>{skill.level}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#526b5c] dark:text-[#a3bda9] block">
                    {skill.projects.length} dự án
                  </span>
                  <div className="flex space-x-1 mt-1 justify-end">
                    {[1, 2, 3, 4].map((step) => {
                      const active =
                        (skill.level === "BEGINNER" && step <= 1) ||
                        (skill.level === "INTERMEDIATE" && step <= 2) ||
                        (skill.level === "ADVANCED" && step <= 3) ||
                        (skill.level === "EXPERT" && step <= 4);
                      return (
                        <div
                          key={step}
                          className={`w-2 h-2 rounded-full ${
                            active ? "bg-[#2d6a4f]" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATES */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Chứng chỉ & Bằng cấp
              </h2>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Lưu trữ chứng chỉ ngoại ngữ (IELTS, TOEIC), AWS, GCP, Coursera, v.v.
              </p>
            </div>
            <button
              onClick={() => setShowAddCertModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm chứng chỉ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white dark:bg-[#142318] p-5 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#ebf4ee] dark:bg-[#203626] text-[#2d6a4f] dark:text-[#74c69d]">
                      {cert.issuer}
                    </span>
                    {cert.score && (
                      <span className="text-xs font-bold text-[#2d6a4f] dark:text-[#74c69d]">
                        Điểm: {cert.score}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#192e22] dark:text-[#f0f7f2] mb-1">
                    {cert.name}
                  </h3>

                  {cert.credentialId && (
                    <p className="text-[11px] text-[#526b5c] dark:text-[#a3bda9] truncate">
                      ID: {cert.credentialId}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#dbe7dd]/70 dark:border-[#263d2e] flex items-center justify-between text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  <span>
                    Ngày cấp: {new Date(cert.issueDate).toLocaleDateString("vi-VN")}
                  </span>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2d6a4f] dark:text-[#52b788] hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <span>Xem link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INTERNSHIP & CAREER APPLICATIONS */}
      {activeTab === "internships" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Theo dõi Thực tập & Đơn ứng tuyển
              </h2>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Quản lý các cơ hội nghề nghiệp, vòng phỏng vấn và phản hồi từ nhà tuyển dụng.
              </p>
            </div>
            <button
              onClick={() => setShowAddAppModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm cơ hội mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-[#142318] p-5 rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        app.status === "OFFER"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : app.status === "INTERVIEW"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : app.status === "REJECTED"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {app.status}
                    </span>
                    <span className="text-[10px] font-semibold text-[#526b5c] dark:text-[#a3bda9]">
                      {app.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#192e22] dark:text-[#f0f7f2]">
                    {app.role}
                  </h3>
                  <p className="text-sm font-semibold text-[#2d6a4f] dark:text-[#74c69d] flex items-center space-x-1 mt-0.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>{app.company}</span>
                  </p>

                  {app.location && (
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] flex items-center space-x-1 mt-2">
                      <MapPin className="w-3 h-3" />
                      <span>{app.location}</span>
                    </p>
                  )}

                  {app.salary && (
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] flex items-center space-x-1 mt-1 font-medium">
                      <DollarSign className="w-3 h-3 text-[#2d6a4f]" />
                      <span>{app.salary}</span>
                    </p>
                  )}
                </div>

                {app.notes && (
                  <div className="mt-3 pt-3 border-t border-[#dbe7dd]/70 dark:border-[#263d2e]">
                    <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] line-clamp-2">
                      {app.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Thêm Dự án */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-lg w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Thêm dự án vào Portfolio
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Tên dự án *
                </label>
                <input
                  type="text"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="ChronoMind Academic OS"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Mô tả dự án
                </label>
                <textarea
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={3}
                  placeholder="Mô tả mục tiêu, tính năng nổi bật và kiến trúc kỹ thuật..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    GitHub / Source Code
                  </label>
                  <input
                    type="url"
                    value={projRepo}
                    onChange={(e) => setProjRepo(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Live Demo Link
                  </label>
                  <input
                    type="url"
                    value={projDemo}
                    onChange={(e) => setProjDemo(e.target.value)}
                    placeholder="https://myproject.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Công nghệ sử dụng (ngăn cách bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  placeholder="Next.js, TypeScript, PostgreSQL, TailwindCSS"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Trạng thái dự án
                </label>
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                >
                  <option value="IN_PROGRESS">Đang phát triển</option>
                  <option value="COMPLETED">Đã hoàn thành</option>
                  <option value="FEATURED">★ Dự án tiêu biểu</option>
                  <option value="PLANNED">Lên kế hoạch</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Lưu dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Kỹ năng */}
      {showAddSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Thêm Kỹ năng mới
            </h3>
            <form onSubmit={handleCreateSkill} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Tên kỹ năng *
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Python, React, System Design, IELTS..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Phân loại
                  </label>
                  <select
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  >
                    <option value="TECH">Kỹ thuật (Tech)</option>
                    <option value="LANGUAGE">Ngoại ngữ</option>
                    <option value="SOFT">Kỹ năng mềm</option>
                    <option value="DESIGN">Thiết kế</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Cấp độ thành thạo
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  >
                    <option value="BEGINNER">Cơ bản (Beginner)</option>
                    <option value="INTERMEDIATE">Khá (Intermediate)</option>
                    <option value="ADVANCED">Nâng cao (Advanced)</option>
                    <option value="EXPERT">Chuyên sâu (Expert)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSkillModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Lưu kỹ năng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Chứng chỉ */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Thêm Chứng chỉ & Bằng cấp
            </h3>
            <form onSubmit={handleCreateCertificate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Tên chứng chỉ *
                </label>
                <input
                  type="text"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="AWS Solutions Architect / IELTS 7.5"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Đơn vị cấp *
                  </label>
                  <input
                    type="text"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="Amazon Web Services"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Điểm số / Hạng
                  </label>
                  <input
                    type="text"
                    value={certScore}
                    onChange={(e) => setCertScore(e.target.value)}
                    placeholder="850 / 8.0"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Mã xác thực (Credential ID)
                  </label>
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    placeholder="AWS-12345"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Đường dẫn chứng chỉ (URL)
                  </label>
                  <input
                    type="url"
                    value={certUrl}
                    onChange={(e) => setCertUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Lưu chứng chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Đơn Ứng tuyển */}
      {showAddAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Thêm cơ hội Thực tập & Việc làm
            </h3>
            <form onSubmit={handleCreateApplication} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Công ty *
                  </label>
                  <input
                    type="text"
                    value={appCompany}
                    onChange={(e) => setAppCompany(e.target.value)}
                    placeholder="Google, VinAI..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Vị trí ứng tuyển *
                  </label>
                  <input
                    type="text"
                    value={appRole}
                    onChange={(e) => setAppRole(e.target.value)}
                    placeholder="Software Engineer Intern"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Loại hình
                  </label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  >
                    <option value="INTERNSHIP">Thực tập (Internship)</option>
                    <option value="PART_TIME">Bán thời gian (Part-time)</option>
                    <option value="FULL_TIME">Chính thức (Full-time)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  >
                    <option value="SAVED">Đã lưu tin</option>
                    <option value="APPLIED">Đã nộp hồ sơ</option>
                    <option value="INTERVIEW">Đang phỏng vấn</option>
                    <option value="OFFER">Nhận Offer</option>
                    <option value="REJECTED">Bị từ chối</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Địa điểm làm việc
                  </label>
                  <input
                    type="text"
                    value={appLocation}
                    onChange={(e) => setAppLocation(e.target.value)}
                    placeholder="Hà Nội / Remote"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Mức lương / Trợ cấp
                  </label>
                  <input
                    type="text"
                    value={appSalary}
                    onChange={(e) => setAppSalary(e.target.value)}
                    placeholder="10 - 15 triệu/tháng"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Ghi chú & Kinh nghiệm
                </label>
                <textarea
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  rows={2}
                  placeholder="Vòng 1: LeetCode + Phỏng vấn văn hóa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAppModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Lưu cơ hội
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
