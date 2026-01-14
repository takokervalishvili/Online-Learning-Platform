export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED'
}

export interface Course {
  id: number;
  title: string;
  description: string;
  teacherId: number;
  teacherName: string;
  category: string;
  duration: number;
  price: number;
  status: CourseStatus;
  isApproved: boolean;
  createdAt: Date;
  updatedAt?: Date;
  totalLessons: number;
  totalAssignments: number;
  enrolledStudents: number;
  averageRating?: number;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
  assignments: Assignment[];
  isEnrolled: boolean;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  attachments: string[];
  orderIndex: number;
  createdAt: Date;
  updatedAt?: Date;
  scheduledDate?: Date;
}

export interface Assignment {
  id: number;
  courseId: number;
  title: string;
  description: string;
  dueDate: Date;
  maxScore: number;
  createdAt: Date;
  updatedAt?: Date;
  totalSubmissions: number;
  hasSubmitted: boolean;
}
