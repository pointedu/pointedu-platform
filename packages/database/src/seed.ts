import { PrismaClient, UserRole, SchoolType, ProgramCategory, InstructorStatus, RequestStatus, PaymentStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean existing data (always clean to ensure fresh seed)
  console.log('🗑️  Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.automationLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.instructorAssignment.deleteMany()
  await prisma.requestDocument.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.schoolRequest.deleteMany()
  await prisma.program.deleteMany()
  await prisma.instructorReview.deleteMany()
  await prisma.instructorSchedule.deleteMany()
  await prisma.schoolContact.deleteMany()
  await prisma.school.deleteMany()
  await prisma.instructor.deleteMany()
  await prisma.resourceAccess.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.notice.deleteMany()
  await prisma.user.deleteMany()
  await prisma.setting.deleteMany()

  // ============================================
  // 1. 시스템 설정
  // ============================================
  console.log('⚙️  Creating system settings...')

  await prisma.setting.createMany({
    data: [
      {
        key: 'COMPANY_NAME',
        value: '포인트교육',
        category: 'COMPANY',
        description: '회사명'
      },
      {
        key: 'COMPANY_ADDRESS',
        value: '경북 영주시 구성로150번길 19',
        category: 'COMPANY',
        description: '회사 주소'
      },
      {
        key: 'COMPANY_PHONE',
        value: '054-XXX-XXXX',
        category: 'COMPANY',
        description: '대표 전화'
      },
      {
        key: 'TAX_WITHHOLDING_RATE',
        value: '0.033',
        type: 'NUMBER',
        category: 'PAYMENT',
        description: '원천징수율 (3.3%)'
      },
      {
        key: 'VAT_RATE',
        value: '0.10',
        type: 'NUMBER',
        category: 'PAYMENT',
        description: '부가세율 (10%)'
      },
      {
        key: 'DEFAULT_MARGIN_RATE',
        value: '0.15',
        type: 'NUMBER',
        category: 'QUOTE',
        description: '기본 마진율 (15%)'
      }
    ]
  })

  // ============================================
  // 2. 사용자 생성
  // ============================================
  console.log('👤 Creating users...')

  const hashedPassword = await bcrypt.hash('pointedu2025', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pointedu.co.kr',
      password: hashedPassword,
      name: '관리자',
      role: UserRole.SUPER_ADMIN,
      phoneNumber: '010-1234-5678',
      active: true
    }
  })

  // 강사 사용자 생성
  const instructor1User = await prisma.user.create({
    data: {
      email: 'garam.kim@pointedu.co.kr',
      password: hashedPassword,
      name: '김가람',
      role: UserRole.INSTRUCTOR,
      phoneNumber: '010-2345-6789',
      active: true
    }
  })

  const instructor2User = await prisma.user.create({
    data: {
      email: 'minho.park@pointedu.co.kr',
      password: hashedPassword,
      name: '박민호',
      role: UserRole.INSTRUCTOR,
      phoneNumber: '010-3456-7890',
      active: true
    }
  })

  const instructor3User = await prisma.user.create({
    data: {
      email: 'seohyun.lee@pointedu.co.kr',
      password: hashedPassword,
      name: '이서현',
      role: UserRole.INSTRUCTOR,
      phoneNumber: '010-4567-8901',
      active: true
    }
  })

  // ============================================
  // 3. 강사 정보 생성
  // ============================================
  console.log('👨‍🏫 Creating instructors...')

  const instructor1 = await prisma.instructor.create({
    data: {
      userId: instructor1User.id,
      name: '김가람',
      homeBase: '영주',
      phoneNumber: '010-2345-6789',
      email: 'garam.kim@pointedu.co.kr',
      subjects: ['항공기 조종사', '로봇공학', 'STEAM'],
      certifications: ['조종사 자격증', '로봇 지도사'],
      experience: 5,
      rangeKm: '40-60',
      maxDistanceKm: 60,
      availableDays: ['화', '수', '목'],
      status: InstructorStatus.ACTIVE,
      rating: 4.8,
      totalClasses: 45,
      defaultSessionFee: 70000,
      notes: '중·고등학생 선호, 실습 위주 수업'
    }
  })

  const instructor2 = await prisma.instructor.create({
    data: {
      userId: instructor2User.id,
      name: '박민호',
      homeBase: '안동',
      phoneNumber: '010-3456-7890',
      email: 'minho.park@pointedu.co.kr',
      subjects: ['신재생에너지', '3D Art', '환경공학'],
      certifications: ['에너지관리사', '3D 모델링 자격증'],
      experience: 3,
      rangeKm: '70-90',
      maxDistanceKm: 90,
      availableDays: ['월', '금'],
      status: InstructorStatus.ACTIVE,
      rating: 4.5,
      totalClasses: 28,
      defaultSessionFee: 70000,
      notes: '초등학생 특화, 에너지 교구 보유'
    }
  })

  const instructor3 = await prisma.instructor.create({
    data: {
      userId: instructor3User.id,
      name: '이서현',
      homeBase: '구미',
      phoneNumber: '010-4567-8901',
      email: 'seohyun.lee@pointedu.co.kr',
      subjects: ['AI 작곡', '디지털 드로잉', '영상 제작'],
      certifications: ['컴퓨터그래픽스운용기능사', '멀티미디어 콘텐츠 제작 전문가'],
      experience: 4,
      rangeKm: '70-90',
      maxDistanceKm: 90,
      availableDays: ['수', '목'],
      status: InstructorStatus.ACTIVE,
      rating: 4.9,
      totalClasses: 52,
      defaultSessionFee: 80000,
      notes: '노트북 지참, 디지털 아트 전문'
    }
  })

  // ============================================
  // 4. 학교 생성
  // ============================================
  console.log('🏫 Creating schools...')

  const school1 = await prisma.school.create({
    data: {
      name: '영주제일고등학교',
      type: SchoolType.HIGH,
      address: '경북 영주시 중앙로 123',
      region: '영주시',
      distanceKm: 5,
      transportFee: 0,
      phoneNumber: '054-123-4567',
      email: 'yjjeil@school.kr',
      totalStudents: 450,
      active: true
    }
  })

  const school2 = await prisma.school.create({
    data: {
      name: '안동중학교',
      type: SchoolType.MIDDLE,
      address: '경북 안동시 평화로 456',
      region: '안동시',
      distanceKm: 30,
      transportFee: 15000,
      phoneNumber: '054-234-5678',
      email: 'andong@school.kr',
      totalStudents: 380,
      active: true
    }
  })

  const school3 = await prisma.school.create({
    data: {
      name: '구미초등학교',
      type: SchoolType.ELEMENTARY,
      address: '경북 구미시 산호대로 789',
      region: '구미시',
      distanceKm: 50,
      transportFee: 30000,
      phoneNumber: '054-345-6789',
      email: 'gumi@school.kr',
      totalStudents: 520,
      active: true
    }
  })

  // ============================================
  // 5. 프로그램 생성
  // ============================================
  console.log('📚 Creating programs...')

  const program1 = await prisma.program.create({
    data: {
      code: 'PROG-4IND-001',
      name: '항공기 조종사 진로체험',
      category: ProgramCategory.FOURTHIND,
      description: '드론 시뮬레이터를 활용한 항공 분야 진로 탐색 프로그램',
      objectives: ['항공 산업 이해', '조종사 직업 체험', '진로 설계'],
      targetGrades: ['중1', '중2', '중3', '고1', '고2'],
      minStudents: 20,
      maxStudents: 35,
      sessionCount: 2,
      sessionMinutes: 45,
      baseMaterialCost: 5000,
      baseSessionFee: 70000,
      requiresEquipment: ['드론 시뮬레이터', '노트북', '프로젝터'],
      difficulty: 3,
      popularity: 85,
      tags: ['4차산업', '항공', 'STEM'],
      active: true,
      featured: true
    }
  })

  const program2 = await prisma.program.create({
    data: {
      code: 'PROG-ART-001',
      name: 'AI 작곡 체험',
      category: ProgramCategory.CULTURE,
      description: 'AI 도구를 활용한 음악 창작 프로그램',
      objectives: ['AI 음악 기술 이해', '작곡 기초', '창의성 개발'],
      targetGrades: ['초5', '초6', '중1', '중2', '중3'],
      minStudents: 15,
      maxStudents: 30,
      sessionCount: 3,
      sessionMinutes: 45,
      baseMaterialCost: 8000,
      baseSessionFee: 90000,
      requiresEquipment: ['PC', '헤드폰', '음악 소프트웨어'],
      difficulty: 4,
      popularity: 92,
      tags: ['AI', '음악', '예술'],
      active: true,
      featured: true
    }
  })

  const program3 = await prisma.program.create({
    data: {
      code: 'PROG-ENV-001',
      name: '신재생에너지 탐구',
      category: ProgramCategory.STEAM,
      description: '태양광, 풍력 등 신재생 에너지 원리 학습 및 모형 제작',
      objectives: ['에너지 전환 이해', '친환경 기술 학습', '실험 능력 향상'],
      targetGrades: ['초4', '초5', '초6'],
      minStudents: 20,
      maxStudents: 30,
      sessionCount: 4,
      sessionMinutes: 40,
      baseMaterialCost: 12000,
      baseSessionFee: 110000,
      requiresEquipment: ['실험 키트', '측정 장비'],
      difficulty: 3,
      popularity: 78,
      tags: ['환경', 'STEAM', '과학'],
      active: true
    }
  })

  // ============================================
  // 6. 학교 요청 생성
  // ============================================
  console.log('📝 Creating school requests...')

  const request1 = await prisma.schoolRequest.create({
    data: {
      requestNumber: 'REQ-2025-001',
      schoolId: school1.id,
      programId: program1.id,
      sessions: 2,
      studentCount: 30,
      targetGrade: '고1',
      desiredDate: new Date('2025-02-15'),
      schoolBudget: 120000,
      status: RequestStatus.SUBMITTED,
      requirements: '1학년 전체 대상, 오전 시간 선호'
    }
  })

  const request2 = await prisma.schoolRequest.create({
    data: {
      requestNumber: 'REQ-2025-002',
      schoolId: school2.id,
      programId: program2.id,
      sessions: 3,
      studentCount: 25,
      targetGrade: '중2',
      desiredDate: new Date('2025-02-20'),
      schoolBudget: 150000,
      status: RequestStatus.QUOTED
    }
  })

  // ============================================
  // 7. 견적 생성
  // ============================================
  console.log('💰 Creating quotes...')

  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: 'QT-2025-001',
      requestId: request2.id,
      sessionFee: 90000,
      transportFee: 15000,
      materialCost: 200000, // 25명 * 8,000원
      assistantFee: 0,
      overhead: 5000,
      subtotal: 310000,
      marginRate: 15,
      marginAmount: 46500,
      vat: 35650,
      total: 392150,
      discount: 0,
      finalTotal: 392150,
      validUntil: new Date('2025-01-31'),
      createdBy: adminUser.id,
      notes: '안동중학교 AI 작곡 체험 견적'
    }
  })

  // ============================================
  // 8. 강사 배정
  // ============================================
  console.log('👨‍🏫 Creating instructor assignments...')

  const assignment1 = await prisma.instructorAssignment.create({
    data: {
      requestId: request1.id,
      instructorId: instructor1.id,
      scheduledDate: new Date('2025-02-15'),
      scheduledTime: '09:00-12:00',
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      confirmedBy: adminUser.id
    }
  })

  // ============================================
  // 9. 정산 생성
  // ============================================
  console.log('💳 Creating payments...')

  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2025-001',
      assignmentId: assignment1.id,
      instructorId: instructor1.id,
      sessionFee: 70000,
      sessions: 2,
      transportFee: 0,
      bonus: 0,
      subtotal: 70000,
      taxWithholding: 2310, // 70,000 * 0.033
      deductions: 0,
      netAmount: 67690,
      status: PaymentStatus.APPROVED,
      accountingMonth: '2025-02',
      fiscalYear: 2025,
      approvedBy: adminUser.id,
      approvedAt: new Date()
    }
  })

  console.log('✅ Seed completed successfully!')
  console.log(`
📊 Created:
  - ${await prisma.user.count()} Users
  - ${await prisma.instructor.count()} Instructors
  - ${await prisma.school.count()} Schools
  - ${await prisma.program.count()} Programs
  - ${await prisma.schoolRequest.count()} Requests
  - ${await prisma.quote.count()} Quotes
  - ${await prisma.instructorAssignment.count()} Assignments
  - ${await prisma.payment.count()} Payments
  - ${await prisma.setting.count()} Settings
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
