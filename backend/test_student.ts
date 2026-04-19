import mongoose from 'mongoose';
import { studentService } from './src/services/student.service';
import { Student } from './src/models/Student.model';

async function run() {
  await mongoose.connect('mongodb://newcareerpointinstitute_db_user:Vw8hVi9pFlcjMdgj@ac-uvhmjat-shard-00-00.mo0d54p.mongodb.net:27017,ac-uvhmjat-shard-00-01.mo0d54p.mongodb.net:27017,ac-uvhmjat-shard-00-02.mo0d54p.mongodb.net:27017/FMS?ssl=true&authSource=admin');
  const student = await Student.findOne();
  if (student) {
    const s = await studentService.findById(student._id.toString());
    console.log(JSON.stringify(s?.toJSON ? s.toJSON() : s, null, 2));
  }
  process.exit(0);
}
run();
