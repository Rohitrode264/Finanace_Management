"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentRepository = void 0;
const Enrollment_model_1 = require("../models/Enrollment.model");
class EnrollmentRepository {
    async findById(id, session) {
        return Enrollment_model_1.Enrollment.findById(id).session(session ?? null);
    }
    async findByStudentAndYear(studentId, academicYear) {
        return Enrollment_model_1.Enrollment.findOne({ studentId, academicYear });
    }
    async create(data, session) {
        const [enrollment] = await Enrollment_model_1.Enrollment.create([data], { session });
        if (!enrollment)
            throw new Error('Failed to create enrollment');
        return enrollment;
    }
    async updateStatus(enrollmentId, status, session) {
        await Enrollment_model_1.Enrollment.findByIdAndUpdate(enrollmentId, { $set: { status } }, { session });
    }
    async updateNetFee(enrollmentId, netFee, concessionType, concessionValue, session) {
        await Enrollment_model_1.Enrollment.findByIdAndUpdate(enrollmentId, { $set: { netFee, concessionType, concessionValue } }, { session });
    }
    async findMany(filter, limit = 50, skip = 0) {
        return Enrollment_model_1.Enrollment.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    }
}
exports.EnrollmentRepository = EnrollmentRepository;
//# sourceMappingURL=enrollment.repository.js.map