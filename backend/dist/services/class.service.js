"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = exports.ClassService = void 0;
const AcademicClass_model_1 = require("../models/AcademicClass.model");
const ClassTemplate_model_1 = require("../models/ClassTemplate.model");
const audit_service_1 = require("./audit.service");
const Enrollment_model_1 = require("../models/Enrollment.model");
const mongoose_1 = require("mongoose");
class ClassService {
    async createTemplate(params) {
        const template = await ClassTemplate_model_1.ClassTemplate.create({
            grade: params.grade.toUpperCase().trim(),
            stream: params.stream?.toUpperCase().trim() ?? null,
            board: params.board,
            createdBy: new mongoose_1.Types.ObjectId(params.createdBy),
        });
        return template;
    }
    async createAcademicClass(params) {
        const template = await ClassTemplate_model_1.ClassTemplate.findById(params.templateId);
        if (!template)
            throw new Error('ClassTemplate not found');
        const academicClass = await AcademicClass_model_1.AcademicClass.create({
            templateId: new mongoose_1.Types.ObjectId(params.templateId),
            academicYear: params.academicYear.trim(),
            section: params.section.toUpperCase().trim(),
            totalFee: params.totalFee,
            installmentPlan: params.installmentPlan,
            isActive: true,
            createdBy: new mongoose_1.Types.ObjectId(params.createdBy),
        });
        audit_service_1.auditService.logAsync({
            actorId: params.createdBy,
            action: 'CLASS_CREATED',
            entityType: 'CLASS',
            entityId: academicClass._id.toString(),
            before: null,
            after: { academicYear: params.academicYear, section: params.section, totalFee: params.totalFee },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
        return academicClass;
    }
    async listTemplates() {
        return ClassTemplate_model_1.ClassTemplate.find().sort({ grade: 1, stream: 1 });
    }
    async findClassesByYear(academicYear) {
        return AcademicClass_model_1.AcademicClass.find({ academicYear, isActive: true })
            .populate('templateId', 'grade stream board')
            .sort({ createdAt: -1 });
    }
    async findById(id) {
        return AcademicClass_model_1.AcademicClass.findById(id).populate('templateId');
    }
    async deactivateClass(params) {
        const cls = await AcademicClass_model_1.AcademicClass.findById(params.classId);
        if (!cls)
            throw new Error('AcademicClass not found');
        await AcademicClass_model_1.AcademicClass.findByIdAndUpdate(params.classId, { $set: { isActive: false } });
        audit_service_1.auditService.logAsync({
            actorId: params.updatedBy,
            action: 'CLASS_UPDATED',
            entityType: 'CLASS',
            entityId: params.classId,
            before: { isActive: true },
            after: { isActive: false },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }
    async deleteClass(params) {
        const cls = await AcademicClass_model_1.AcademicClass.findById(params.classId);
        if (!cls)
            throw new Error('AcademicClass not found');
        // Safety check: Ensure no active or completed enrollments are attached to this class
        const enrollmentCount = await Enrollment_model_1.Enrollment.countDocuments({ academicClassId: params.classId });
        if (enrollmentCount > 0) {
            throw new Error(`Cannot delete class. There are ${enrollmentCount} enrollments associated with it.`);
        }
        await AcademicClass_model_1.AcademicClass.findByIdAndDelete(params.classId);
        audit_service_1.auditService.logAsync({
            actorId: params.deletedBy,
            action: 'CLASS_DELETED',
            entityType: 'CLASS',
            entityId: params.classId,
            before: cls.toObject(),
            after: null,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }
    async countTotal() {
        return AcademicClass_model_1.AcademicClass.countDocuments({ isActive: true });
    }
    async getUniqueSessions() {
        const years = await AcademicClass_model_1.AcademicClass.distinct('academicYear', { isActive: true });
        return years.sort().reverse(); // Show latest sessions first
    }
}
exports.ClassService = ClassService;
exports.classService = new ClassService();
//# sourceMappingURL=class.service.js.map