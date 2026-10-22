/* ภาษาไทย / อังกฤษ — แปลข้อความที่วาดลงหน้าจอแล้ว จึงไม่ต้องแก้ทุกจุดที่สร้าง HTML
   ชื่อคน ชื่อบริษัท และข้อความที่ผู้ใช้พิมพ์เอง ไม่ถูกแปล (ไม่อยู่ในพจนานุกรม) */
// shortcut: แปลด้วยการจับคู่ข้อความตรง ๆ — ถ้าชื่อบริษัท/ข้อความลูกค้ามีคำเดียวกับในพจนานุกรม จะถูกแปลไปด้วย, ถ้าต้องการแม่นยำกว่านี้ต้องเปลี่ยนไปใช้คีย์ข้อความทุกจุดที่สร้าง HTML
const LANGS = [['th', 'ไทย'], ['en', 'English']];
let lang = (() => { try { return localStorage.getItem('gitsd-lang') === 'en' ? 'en' : 'th'; } catch { return 'th'; } })();

/* คำที่อาจอยู่ในชื่อบริษัทของลูกค้า — แปลเฉพาะเมื่อข้อความทั้งก้อนตรงกันเท่านั้น */
const WHOLE_ONLY = new Set(['บริษัท', 'จำกัด', 'มหาชน', 'ห้างหุ้นส่วน', 'ร้าน', 'สาขา', 'คลินิก']);

const EN = {
  /* ทั่วไป */
  'หน้าหลัก': 'Home', 'งาน': 'Jobs', 'งานของฉัน': 'My jobs', 'งานทั้งหมด': 'All jobs', 'ฉัน': 'Me', 'ของฉัน': 'my', 'เมนูหลัก': 'Main menu',
  'โปรเจกต์': 'Projects', 'ทีมช่าง': 'Technicians', 'ภารกิจ': 'Mission', 'พาร์ทเนอร์': 'Partners',
  'รายงาน': 'Reports', 'ผู้ใช้และสิทธิ์': 'Users & permissions', 'บันทึกตรวจสอบ': 'Audit log',
  'ทั้งหมด': 'All', 'บันทึก': 'Save', 'ยกเลิก': 'Cancel', 'ปิด': 'Close', 'ลบ': 'Delete', 'แก้ไข': 'Edit',
  'เพิ่ม': 'Add', 'ยืนยัน': 'Confirm', 'ส่ง': 'Send', 'ค้นหา': 'Search', 'ล้าง': 'Clear', 'ย่อ': 'Collapse', 'ขยาย': 'Expand',
  'กลับ': 'Back', 'กลับไปหน้าก่อนหน้า': 'Back to previous page', 'กลับหน้าหลัก': 'Back to home', 'ไว้ทีหลัง': 'Later',
  'ไม่มี': 'None', 'ยังไม่มี': 'None yet', 'ยังไม่ระบุ': 'Not set', 'ไม่มีให้เว้นว่าง': 'Leave blank if none',
  'คน': 'people', 'รายการ': 'items', 'ชม.': 'h', 'ชั่วโมง': 'hours', 'นาที': 'minutes', 'ดาว': 'stars', 'บริษัท': 'Company',
  'เมื่อสักครู่': 'just now', 'นาทีที่แล้ว': 'minutes ago', 'ชม.ที่แล้ว': 'h ago', 'อีก': 'in', 'ล่าช้า': 'overdue',
  'โดย': 'by', 'ให้': 'to', 'แล้ว': 'done', 'ด้านล่าง': 'below', 'ว่าง': 'Available', 'ค้าง': 'open',

  /* สถานะงาน */
  'ใหม่': 'New', 'มอบหมายแล้ว': 'Assigned', 'กำลังดำเนินการ': 'In progress', 'พักงาน': 'On hold',
  'รอลูกค้าเซ็นรับ': 'Awaiting sign-off', 'ปิดงาน': 'Closed', 'ปิดแล้ว': 'Closed', 'เสร็จแล้ว': 'Done',
  'ได้รับเรื่องแล้ว': 'Received', 'มอบหมายช่างแล้ว': 'Technician assigned', 'ช่างกำลังแก้ไข': 'Technician working',
  'รอดำเนินการ': 'Pending', 'รอคุณยืนยันงาน': 'Waiting for your confirmation', 'เสร็จสิ้น': 'Completed',
  'รับเรื่อง': 'Received', 'มอบหมายช่าง': 'Assign technician', 'กำลังแก้ไข': 'Working', 'ยังไม่มอบหมาย': 'Unassigned',
  'รอมอบหมาย': 'To assign', 'กำลังทำ': 'In progress', 'รอเซ็นรับ': 'To sign off', 'ต้องทำ': 'To do',
  'ยังไม่เสร็จ': 'Not finished', 'เปิดอยู่': 'open', 'งานเปิด': 'open jobs', 'งานเปิดอยู่': 'Open jobs', 'งานเสร็จ': 'Jobs done',

  /* ความสำคัญ */
  'ความสำคัญ': 'Priority', 'ด่วนมาก': 'Urgent', 'ด่วน': 'Urgent', 'สูง': 'High', 'ปานกลาง': 'Medium', 'ต่ำ': 'Low',
  'ไม่เร่งด่วน': 'Not urgent', 'กระทบงานหลายคน': 'Affects several people', 'มีงานด่วน': 'has urgent jobs',

  /* ประเภทงาน / หมวดหมู่ */
  'ประเภท': 'Type', 'ประเภทงาน': 'Job type', 'งานบริการ': 'Service', 'ร้องเรียน': 'Complaint', 'งานโครงการ': 'Project work',
  'เครื่องพิมพ์': 'Printer', 'อินเทอร์เน็ต/เครือข่าย': 'Internet / network', 'บัญชี/รหัสผ่าน': 'Account / password',
  'ติดตั้งเครื่อง': 'Installation', 'ซ่อมอุปกรณ์': 'Repair', 'กล้องวงจรปิด': 'CCTV', 'อื่น ๆ': 'Other',

  /* บทบาท */
  'ลูกค้า': 'Customer', 'ช่างเทคนิค': 'Technician', 'หัวหน้าทีม': 'Team leader', 'ผู้ดูแลระบบ': 'Administrator',
  'ช่าง': 'Technician', 'ตัวแทนบริษัท': 'Company representative', 'ทีมบริการภาคสนาม': 'Field service team',
  'ผู้ใช้ตามบทบาท': 'Users by role', 'ตารางสิทธิ์ตามบทบาท': 'Permissions by role', 'ผู้ใช้ในระบบ': 'Users',

  /* เข้าสู่ระบบ */
  'เข้าสู่ระบบ': 'Sign in', 'เข้าสู่ระบบเจ้าหน้าที่': 'Staff sign-in', 'ออกจากระบบ': 'Sign out',
  'สำหรับช่าง หัวหน้าทีม และผู้ดูแลระบบ': 'For technicians, team leaders and administrators',
  'Guru IT Service Desk · สำหรับลูกค้า': 'Guru IT Service Desk · for customers',
  'อีเมลที่ลงทะเบียน': 'Registered email', 'เข้าสู่ระบบสำหรับช่าง / เจ้าหน้าที่': 'Sign in as technician / staff',
  'กลับไปเข้าสู่ระบบลูกค้า': 'Back to customer sign-in', 'กลับไปหน้าเข้าสู่ระบบ': 'Back to sign-in', 'ยังไม่มีบัญชี?': 'No account yet?',
  'เปิดลิงก์สมัครที่ได้จากตัวแทนบริษัท หรือค้นหาบริษัทของคุณ': 'Open the invite link from your company representative, or search for your company',
  'รหัส หรือชื่อบริษัท': 'Company code or name', 'สมัคร': 'Sign up', 'สมัครใช้งาน': 'Sign up',
  'เริ่มต้นใช้งาน': 'Get started', 'สร้างบัญชีผู้ดูแลระบบคนแรก': 'Create the first administrator account',
  'สร้างบัญชีและเข้าใช้งาน': 'Create account and sign in', 'สร้างผู้ดูแลระบบคนแรก': 'Created the first administrator',
  'เริ่มต้นระบบ': 'System setup',
  'จากนั้นเพิ่มหัวหน้าทีม ช่าง และพาร์ทเนอร์ได้ในระบบ': 'You can then add team leaders, technicians and partners',
  'อีเมลไม่ถูกต้อง (เช่น name@company.com)': 'Invalid email (e.g. name@company.com)',
  'อีเมลนี้มีในระบบแล้ว': 'That email is already in use',
  'อีเมลนี้เป็นบัญชีลูกค้า — กด': 'That email is a customer account — press',
  'อีเมลนี้เป็นบัญชีเจ้าหน้าที่ — กด': 'That email is a staff account — press',
  'ไม่พบบัญชีของอีเมลนี้ — สมัครด้วยลิงก์จากตัวแทนบริษัท หรือรอการอนุมัติ': 'No account for that email — sign up with the invite link from your company representative, or wait for approval',
  'ไม่พบบัญชีเจ้าหน้าที่ของอีเมลนี้ — ติดต่อหัวหน้าทีมหรือผู้ดูแลระบบ': 'No staff account for that email — contact your team leader or an administrator',
  'เข้าใช้งานในฐานะ': 'Signed in as', 'ยืนยันตัวตนด้วยการเข้าสู่ระบบ': 'Identity confirmed by sign-in',
  'พิมพ์รหัส หรือชื่อบริษัทอย่างน้อย 3 ตัวอักษร': 'Enter the company code, or at least 3 letters of the name',
  'ไม่พบบริษัท — ตรวจชื่ออีกครั้ง หรือขอลิงก์จากตัวแทนบริษัท': 'Company not found — check the name, or ask your representative for a link',
  'แตะเพื่อสมัครในนามบริษัทนี้': 'Tap to sign up with this company',

  /* สมัคร / อนุมัติสมาชิก */
  'ชื่อ-นามสกุล': 'Full name', 'ชื่อ': 'Name', 'อีเมล': 'Email', 'อีเมล (ใช้เข้าสู่ระบบ)': 'Email (used to sign in)',
  'เบอร์โทร': 'Phone', 'โทร': 'Phone', 'ทำงานที่': 'Works at', 'รูปของคุณ (ไม่บังคับ)': 'Your photo (optional)',
  'รูปของคุณ': 'Your photo', 'เปลี่ยนรูป': 'Change photo', 'รูปโปรไฟล์': 'Profile photo',
  'ส่งคำขอ': 'Send request', 'ส่งคำขอแล้ว': 'Request sent', 'กลับหน้าเข้าสู่ระบบ': 'Back to sign-in',
  'ตัวแทนบริษัทจะยืนยันว่าคุณเป็นพนักงานจริง ก่อนเข้าใช้งาน': 'Your company representative will confirm you work there before you get access',
  'จะยืนยันว่าคุณเป็นพนักงานจริง': 'will confirm that you work there',
  'เมื่ออนุมัติแล้วคุณจะเข้าใช้งานได้ทันที': 'Once approved you can sign in right away',
  'ตัวแทนของ': 'The representative of', 'ลิงก์สมัคร': 'Invite link',
  'ลิงก์สมัครไม่ถูกต้อง — ขอลิงก์ใหม่จากตัวแทนบริษัทของคุณ': 'Invalid invite link — ask your company representative for a new one',
  'คำขอเข้าใช้งาน': 'Access requests', 'คำขอเข้าใช้งานใหม่': 'New access request', 'ขอเข้าใช้งานในนาม': 'requests access for',
  'ยอมรับ': 'Accept', 'ปฏิเสธ': 'Reject', 'ปฏิเสธคำขอแล้ว': 'Request rejected', 'เข้าใช้งานได้แล้ว': 'can now sign in',
  'สมาชิกใหม่': 'new member', 'อนุมัติ': 'Approve', 'อนุมัติไม่ได้:': 'Cannot approve:',
  '— กดปฏิเสธ แล้วให้สมัครด้วยอีเมลอื่น': '— reject it and ask them to sign up with another email',
  'อีเมล/เบอร์นี้ส่งคำขอแล้ว รอตัวแทนบริษัทอนุมัติ': 'That email or phone already has a request waiting for approval',
  'ชวนพนักงานเข้าใช้งาน': 'Invite staff', 'ส่งลิงก์สมัคร — คุณเป็นผู้อนุมัติ': 'Send an invite link — you approve the requests',
  'ส่งลิงก์นี้ให้พนักงาน (เช่นทาง LINE) — เมื่อมีคนสมัคร คำขอจะขึ้นที่หน้าหลักของคุณให้กดยอมรับ': 'Send this link to your staff (for example on LINE) — requests appear on your home page for you to accept',
  'แชร์ลิงก์': 'Share link', 'คัดลอกลิงก์': 'Copy link', 'คัดลอกลิงก์แล้ว — ส่งให้พนักงานได้เลย': 'Link copied — send it to your staff',
  'กดค้างที่ลิงก์ด้านบนเพื่อคัดลอก': 'Press and hold the link above to copy it',
  'บริษัทของฉัน': 'My company', 'ชวนและอนุมัติพนักงานของบริษัทได้': 'Can invite and approve the company’s staff',

  /* แจ้งปัญหา */
  'แจ้งปัญหา': 'Report an issue', 'แจ้งปัญหาใหม่': 'Report a new issue', 'สร้างงาน': 'Create job', 'สร้างงานใหม่': 'New job',
  'ร้องเรียน / ติชม': 'Complaint / feedback', 'ร้องเรียน / ติชมบริการ': 'Complaint / service feedback',
  'บอกเราสั้น ๆ ว่าเกิดอะไรขึ้น': 'Tell us briefly what happened', 'ปัญหาที่พบ': 'The problem',
  'เรื่องที่ร้องเรียน': 'What the complaint is about',
  'เล่าสิ่งที่ไม่พอใจ — หัวหน้าทีมจะดูแลเรื่องนี้โดยตรง': 'Tell us what went wrong — the team leader handles this directly',
  'เช่น เครื่องพิมพ์ชั้น 2 พิมพ์ไม่ออก': 'e.g. the printer on floor 2 will not print',
  'เช่น ช่างมาช้ากว่านัด ไม่มีใครโทรแจ้ง': 'e.g. the technician arrived late and nobody called',
  'เช่น คอมพิวเตอร์เปิดไม่ติด': 'e.g. the computer will not start',
  'เช่น ชั้น 2 ห้องบัญชี': 'e.g. floor 2, accounts room', 'ชั้น / ห้อง / จุด': 'Floor / room / spot',
  'ที่ไหน?': 'Where?', 'สถานที่': 'Site', 'สถานที่และรายละเอียด': 'Site and details', 'รายละเอียด': 'Details',
  'อาการที่พบ เกิดตั้งแต่เมื่อไร': 'What happens, and since when', 'หัวข้อ': 'Subject',
  'พูดแทนพิมพ์': 'Speak instead of typing', 'พูดแจ้งปัญหา': 'Report by voice', 'พูด': 'Speak', 'พิมพ์ด้วยเสียง': 'Voice typing',
  'ถ่าย / แนบรูป': 'Take / attach photo', 'ถ่ายรูปแจ้ง': 'Report with a photo', 'แนบรูป': 'Attach photo',
  'แจ้งปัญหาพร้อมรูปภาพ': 'Report with photos', 'รูป': 'photos', 'รูปที่': 'photo', 'ลบรูปที่': 'Remove photo',
  'แนบได้สูงสุด': 'You can attach at most', 'แนบได้อีก': 'You can attach',
  'เปิดไฟล์รูปนี้ไม่ได้': 'Cannot open that image', 'ดูรูปขนาดใหญ่': 'View larger', 'รูปขนาดใหญ่': 'Larger image', 'ปิดรูป': 'Close image',
  'กำลังฟัง… พูดได้เลย แตะไมค์อีกครั้งเมื่อพูดจบ': 'Listening… speak now, tap the mic again when you are done',
  'กรุณาอนุญาตให้ใช้ไมโครโฟน': 'Please allow microphone access',
  'ใช้เสียงไม่ได้ในตอนนี้ — พิมพ์แทนได้': 'Voice is unavailable right now — you can type instead',
  'ไม่ได้ยินเสียง ลองใหม่อีกครั้ง': 'Nothing heard, please try again',
  'กรุณาพิมพ์ พูด หรือแนบรูปปัญหาที่พบ': 'Please type, speak or attach a photo of the problem',
  'ส่งเรื่อง': 'Submit', 'ส่งเรื่องเรียบร้อย': 'Submitted', 'เราได้รับเรื่องแล้ว': 'We have received your report',
  'ทีมงานจะจัดช่างและติดต่อกลับ': 'Our team will assign a technician and get back to you',
  'ทีมงานกำลังจัดช่างที่เหมาะสมให้คุณ': 'We are finding the right technician for you',
  'ทีมงานจะแจ้งความคืบหน้า': 'We will keep you posted', 'เราจะแจ้งทันทีเมื่อเสร็จ': 'We will tell you as soon as it is done',
  'ใช้งานไม่ได้เลย / กระทบหลายคน': 'Completely down / affects many people',
  'ใช้งานไม่ได้ทั้งหมด': 'Completely down', 'ใช้งานได้บางส่วน': 'Partly working',
  'กรุณาเลือกสถานที่': 'Please choose a site', 'กรุณาเลือกประเภทปัญหา': 'Please choose a problem type',
  'กรุณากรอกหัวข้อ': 'Please enter a subject', 'กรุณากรอกข้อมูลนี้': 'Please fill this in',

  /* รายการงาน / รายละเอียดงาน */
  'เฉพาะงานที่มอบหมายให้คุณ': 'Only jobs assigned to you', 'ทุกงานในระบบ': 'Every job in the system',
  'ค้นหาเลขงาน หัวข้อ สถานที่…': 'Search job number, subject, site…', 'ค้นหางาน': 'Search jobs',
  'ไม่พบงานที่ตรงเงื่อนไข': 'No jobs match', 'ไม่พบงานนี้': 'Job not found', 'ไม่พบข้อมูล': 'Not found',
  'ยังไม่มีงาน — มีอะไรให้ช่วย กดปุ่ม + ได้เลย': 'No jobs yet — press + if we can help with anything',
  'ยังไม่มีงาน': 'No jobs yet', 'ไม่มีงาน': 'No jobs', 'ไม่มีงานค้าง': 'No jobs outstanding',
  'ไม่มีงานค้าง — ทุกอย่างเรียบร้อย': 'Nothing outstanding — all clear',
  'งานล่าสุด': 'Recent jobs', 'งานที่กำลังทำ': 'Jobs in progress', 'งานที่ทำเสร็จ': 'Completed jobs',
  'รายละเอียดงาน': 'Job details', 'ปัญหาที่แจ้ง': 'Reported problem', 'การสนทนา': 'Conversation',
  'ประวัติ': 'History', 'ขั้นตอนงาน': 'Job steps', 'ขั้นตอนถัดไป': 'Next step',
  'ไม่มีขั้นตอนถัดไปสำหรับบทบาทนี้': 'No next step for this role',
  'ผู้รับผิดชอบ': 'Assigned to', 'ผู้ปฏิบัติงาน ·': 'Technician ·', 'ช่าง:': 'Technician:',
  'มอบหมาย': 'Assign', 'มอบหมายงาน': 'Assign job', 'ย้ายผู้รับผิดชอบ': 'Reassign', 'มอบหมาย / ย้ายงาน': 'Assign / reassign',
  'กรุณาเลือกผู้รับผิดชอบ': 'Please choose someone', 'แนะนำ': 'Suggested', '— ถนัด': '— skilled in', 'ถนัด': 'Skills',
  'เปลี่ยนสถานะ': 'Change status', 'เปลี่ยนสถานะงาน': 'Change job status', 'เปลี่ยนสถานะงานของตัวเอง': 'Change status of their own jobs',
  'เปลี่ยนสถานะได้เฉพาะช่างที่รับผิดชอบงานนี้': 'Only the assigned technician can change the status',
  'เริ่มงาน': 'Start', 'เริ่มดำเนินการ': 'Start work', 'กลับมาทำต่อ': 'Resume', 'พักงานชั่วคราว': 'Put on hold',
  'เหตุผลที่พักงาน (ลูกค้าเห็น)': 'Reason for the hold (customers see this)',
  'เช่น รออะไหล่ 2-3 วัน / รอลูกค้าสะดวก': 'e.g. waiting for parts for a few days / waiting for the customer',
  'เปิดงานอีกครั้ง': 'Reopen', 'เหตุผลที่เปิดงานอีกครั้ง': 'Reason for reopening',
  'เช่น ลูกค้าแจ้งว่าปัญหากลับมาอีก': 'e.g. the customer says the problem came back',
  'งานนี้ปิดแล้ว — หัวหน้าทีมเปิดงานอีกครั้งได้': 'This job is closed — a team leader can reopen it',
  'ปิดงานโดยไม่มีลายเซ็น': 'Close without a signature', 'ปิดงาน (ไม่มีลายเซ็น)': 'Close (no signature)',
  'ปิดงานโดยไม่มีลายเซ็นลูกค้า': 'Closing without the customer’s signature',
  'ปิดงาน (ไม่มีลายเซ็น) / เปิดซ้ำ': 'Close (no signature) / reopen',
  'เช่น ลูกค้ายืนยันทางโทรศัพท์ / ติดต่อลูกค้าไม่ได้เกิน 7 วัน': 'e.g. confirmed by phone / customer unreachable for over 7 days',
  'ปิดแล้ว ขอบคุณที่ใช้บริการ': 'Closed — thank you', 'ขอบคุณที่ใช้บริการ': 'Thank you for your business',
  'เสร็จเรียบร้อย': 'All done', 'แจ้งเมื่อ': 'reported', 'แจ้ง': 'reported', 'วันที่แจ้ง': 'Reported on',

  /* ความเห็น / work log / โน้ต */
  'ตอบลูกค้า': 'Reply to customer', 'คุยกับทีมงาน': 'Talk to the team', 'บันทึกภายใน': 'Internal note',
  'พิมพ์ข้อความถึงทีมงาน…': 'Write a message to the team…', 'พิมพ์ข้อความถึงลูกค้า…': 'Write a message to the customer…',
  'ลูกค้าจะเห็นข้อความนี้': 'The customer will see this', 'เห็นเฉพาะทีมงาน — ลูกค้าไม่เห็น': 'Team only — customers cannot see this',
  'ส่งข้อความแล้ว': 'Message sent', 'บันทึกภายในแล้ว': 'Internal note saved', 'ยังไม่มีข้อความ': 'No messages yet',
  'เพิ่มข้อความ': 'Add a message', 'ข้อความ': 'Message', '(ภายใน)': '(internal)', '(ทีมงาน)': '(team)', '(สาธารณะ)': '(public)',
  'บันทึกการทำงาน': 'Work log', 'บันทึกการทำงานแล้ว': 'Work log saved', 'ยังไม่มีบันทึกการทำงาน': 'No work log yet',
  'ทำอะไรไป ใช้เวลาเท่าไร…': 'What you did and how long it took…',
  'บันทึกสำหรับทีมงาน…': 'Note for the team…', 'เห็นบันทึกภายใน / Work log': 'See internal notes / work log',
  'โน้ตส่วนตัว': 'Private notes', 'โน้ตใหม่': 'New note', 'ยังไม่มีโน้ต': 'No notes yet', 'ลบโน้ต': 'Delete note',
  'จดอะไรก็ได้…': 'Jot anything down…', 'เห็นเฉพาะคุณ': 'Only you can see this', 'โน้ต · เห็นเฉพาะคุณ': 'Notes · only you',

  /* ใบรายงาน / เซ็นรับ / คะแนน */
  'ใบรายงาน': 'Service report', 'ใบรายงานการปฏิบัติงาน': 'Service report', 'ดูใบรายงาน': 'View report',
  'ดูใบรายงานฉบับเต็ม': 'View the full report', 'ดู / พิมพ์ใบรายงาน': 'View / print reports',
  'ออกใบรายงาน': 'Issue report', 'ทำเสร็จ — ออกใบรายงาน': 'Finish — issue report', 'ทำเสร็จ': 'Finish',
  'ออกใบรายงานเมื่อทำเสร็จ': 'Issue a report when the work is done', 'ออกใบรายงานเมื่อเสร็จงาน': 'Issue a report on completion',
  'สรุปงานที่ทำ': 'Summary of the work', 'สรุปงาน': 'Work summary', 'กรุณาสรุปงานที่ทำ': 'Please summarise the work',
  'รายละเอียดการดำเนินงาน': 'What was done',
  'เช่น เปลี่ยนลูกกลิ้งดึงกระดาษ ทดสอบพิมพ์ 20 แผ่นปกติ': 'e.g. replaced the paper roller, test-printed 20 pages fine',
  'ลูกค้าจะเห็นใบรายงานนี้และใช้เซ็นรับงาน — เขียนให้ลูกค้าเข้าใจ': 'The customer reads this report and signs it — write it plainly',
  'อุปกรณ์ / อะไหล่ที่ใช้': 'Parts used', 'อุปกรณ์/อะไหล่': 'Parts', 'เวลาที่ใช้': 'Time spent', 'เวลาที่ใช้ (ชั่วโมง)': 'Time spent (hours)',
  'ชั่วโมงทำงานรวม': 'Total hours', 'รูปหลังซ่อม': 'Photos after the work', 'รูปหลังดำเนินการ': 'Photo after the work',
  'รูปภาพประกอบ': 'Photos', 'รูปปัญหาที่ลูกค้าถ่าย': 'Photo taken by the customer',
  'เซ็นรับงาน': 'Sign off', 'เซ็นรับ': 'Sign off', 'เซ็นชื่อ': 'Sign', 'ลงนาม': 'Sign', 'เซ็นแล้ว': 'Signed',
  'เซ็นรับแล้ว': 'Signed off', 'ลูกค้าเซ็นรับแล้ว': 'Customer signed off', 'ลูกค้าเซ็นรับงาน': 'Customer sign-off',
  'เซ็นรับงานเรียบร้อย': 'Signed off', 'เซ็นรับงานแล้ว — ปิดงานเรียบร้อย': 'Signed off — the job is closed',
  'เซ็นรับงานและให้คะแนน': 'Sign off and rate', 'ตรวจสอบและเซ็นรับงาน': 'Review and sign off',
  'ตรวจสอบผลงานแล้วเซ็นรับได้เลย': 'Check the work, then sign off',
  'งานเสร็จแล้ว — กรุณาเซ็นรับ': 'The work is done — please sign off',
  'งานเสร็จแล้ว — รอคุณเซ็นรับ': 'The work is done — waiting for your sign-off',
  'งานเสร็จแล้ว — กรุณาตรวจสอบใบรายงาน': 'The work is done — please check the report',
  'รอคุณเซ็นรับ': 'Waiting for your sign-off', 'รอลงนาม': 'Awaiting signature', 'สถานะลงนาม': 'Signature status',
  'รอลูกค้าเซ็นรับงาน — เมื่อเซ็นแล้วงานจะปิดอัตโนมัติ': 'Waiting for the customer to sign — the job closes automatically once they do',
  'ให้ลูกค้าเซ็น': 'Let the customer sign', 'เซ็นหน้างาน': 'Sign on site', 'เซ็นผ่านแอป': 'Signed in the app',
  'ให้ลูกค้าเซ็นบนเครื่องนี้': 'Let the customer sign on this device',
  'ให้ลูกค้าเซ็นบนเครื่องนี้ทันที': 'Hand the device to the customer to sign now',
  'ให้ลูกค้าเซ็นรับงานบนเครื่องนี้': 'Let the customer sign off on this device',
  'ให้ลูกค้าเซ็นรับงานหน้างาน': 'Let the customer sign on site', 'ให้ลูกค้าเซ็นหน้างาน': 'Customer signs on site',
  'ยื่นเครื่องให้ลูกค้าตรวจสอบและเซ็นรับงาน': 'Hand the device to the customer to check and sign',
  'เหมาะเมื่ออยู่หน้างานกับลูกค้า': 'Best when you are on site with the customer',
  'ส่งให้ลูกค้าเซ็นในแอป': 'Send to the customer to sign in the app',
  'ลงนามบนอุปกรณ์ของช่าง ณ หน้างาน': 'Signed on the technician’s device on site',
  'ลงนามผ่านแอปของลูกค้า': 'Signed in the customer’s app',
  'ช่องเซ็นชื่อ': 'Signature box', 'ลายเซ็น': 'Signature', 'ลายเซ็นผู้รับบริการ': 'Customer signature',
  'ใช้นิ้วหรือเมาส์เซ็นในกรอบนี้': 'Sign in this box with your finger or mouse',
  'กรุณาเซ็นชื่อในกรอบ': 'Please sign in the box', 'กรุณากรอกชื่อผู้รับงาน': 'Please enter the name of the person signing',
  'ชื่อผู้รับงาน': 'Name of person signing', 'ผู้ลงนาม': 'Signed by', 'ผู้รับบริการ': 'Customer', 'วันที่ลงนาม': 'Signed on',
  'เช่น ผู้จัดการสาขา': 'e.g. branch manager', 'ตำแหน่ง': 'Position',
  'การเซ็นนี้ยืนยันว่าได้รับบริการตามใบรายงานนี้เรียบร้อยแล้ว': 'Signing confirms the service in this report was delivered',
  'ปิดโดยไม่มีลายเซ็น': 'Closed without a signature',
  'หมายเหตุ: ปิดงานโดยไม่มีลายเซ็นลูกค้า —': 'Note: closed without the customer’s signature —',
  'งานยังไม่เรียบร้อย': 'The work is not right', 'ยังไม่เรียบร้อย': 'Not right', 'ยังไม่เรียบร้อย:': 'Not right:',
  'ส่งกลับให้ช่าง': 'Send back to the technician', 'ส่งกลับให้ช่างแล้ว': 'Sent back to the technician',
  'ส่งกลับไปแก้ไข': 'Send back for more work', 'สิ่งที่ต้องแก้ไขเพิ่ม': 'What still needs fixing',
  'ลูกค้าส่งงานกลับ': 'Customer sent the job back', 'ปัญหาที่ยังพบ': 'What is still wrong',
  'กรุณาระบุปัญหาที่ยังพบ': 'Please say what is still wrong',
  'เช่น ยังพิมพ์ไม่ออกที่เครื่องชั้น 2': 'e.g. the printer on floor 2 still will not print',
  'เช่น ทดสอบไม่ผ่านที่เครื่องลูกค้าอีก 1 เครื่อง': 'e.g. one more of the customer’s machines failed the test',
  'งานจะถูกส่งกลับให้ช่างดำเนินการต่อ': 'The job goes back to the technician',
  'ให้คะแนน': 'Rate', 'ให้คะแนนบริการ': 'Rate the service', 'ให้คะแนนความพึงพอใจ': 'Rate your satisfaction',
  'ให้ลูกค้าให้คะแนนบริการ': 'Let the customer rate the service', 'ให้ลูกค้าให้คะแนนหน้างาน': 'Let the customer rate on site',
  'บริการครั้งนี้เป็นอย่างไร?': 'How was the service?', 'บริการครั้งล่าสุดเป็นอย่างไร?': 'How was your last service?',
  'แตะดาวเพื่อให้คะแนน': 'Tap a star to rate', 'แตะเพื่อให้คะแนน': 'Tap to rate',
  'แตะเพื่อให้คะแนน — ใช้เวลา 5 วินาที': 'Tap to rate — it takes 5 seconds',
  'อยากบอกอะไรเพิ่มเติม (ไม่บังคับ)': 'Anything else you want to tell us (optional)',
  'ส่งคะแนน': 'Send rating', 'ขอบคุณสำหรับคะแนน': 'Thank you for the rating', 'คะแนน': 'Rating',
  'คะแนน (1-5)': 'Rating (1-5)', 'ความพึงพอใจ': 'Satisfaction', 'ความพึงพอใจเฉลี่ย': 'Average satisfaction',
  'ความคิดเห็น': 'Comment', 'ความคิดเห็นลูกค้า': 'Customer comment', 'จาก 5 ดาว': 'out of 5',
  'ต้องปรับปรุง': 'Poor', 'พอใช้': 'Fair', 'ดี': 'Good', 'ดีมาก': 'Excellent',

  /* ภารกิจ / GPS */
  'ติดตามช่าง': 'Track technicians', 'ติดตามช่างภาคสนาม': 'Track field technicians', 'ภารกิจภาคสนาม': 'Field mission',
  'ไม่มีภารกิจในขณะนี้': 'No missions right now', 'เห็นตำแหน่งเฉพาะช่างในทีมของคุณ': 'You only see technicians in your team',
  'แชร์ตำแหน่งเฉพาะระหว่างภารกิจ · ลูกค้าเห็นแค่': 'Location is shared only during a mission · customers only see',
  'กำลังเดินทาง': 'On the way', 'กำลังเดินทางไปหาคุณ': 'On the way to you', 'ออกเดินทาง': 'Set off',
  'ถึงหน้างาน': 'Arrive on site', 'ถึงหน้างานแล้ว': 'Arrived on site', 'ถึงที่หมายแล้ว': 'Arrived',
  'อยู่ที่หน้างานแล้ว': 'On site', 'กำลังปฏิบัติงาน': 'Working', 'เริ่มปฏิบัติงาน': 'Start working',
  'จบภารกิจ': 'End mission', 'รับงานแล้ว': 'Accepted', 'ออกเมื่อ': 'left at', 'ตำแหน่งล่าสุด': 'Last position',
  'เริ่มแชร์ตำแหน่ง': 'Start sharing location', 'สิ้นสุดการแชร์ตำแหน่ง': 'Stopped sharing location',
  'จะเริ่มแชร์ตำแหน่งเมื่อกด': 'Location sharing starts when you press',
  'ช่างยังไม่เริ่มแชร์ตำแหน่ง': 'The technician has not started sharing location',
  'ดูตำแหน่ง GPS': 'See GPS location', 'ดูตำแหน่ง GPS ของช่าง (ความเป็นส่วนตัว)': 'See technicians’ GPS location (privacy)',
  'ผู้ดูแลระบบไม่เห็นตำแหน่ง GPS ของช่าง': 'Administrators cannot see technicians’ GPS location',
  'ข้อมูลตำแหน่งเปิดให้เฉพาะช่างเจ้าของภารกิจและหัวหน้าทีมของเขา เพื่อความเป็นส่วนตัว': 'Location is visible only to the technician on the mission and their team leader, for privacy',
  'ไม่แสดงตำแหน่ง — อยู่นอกขอบเขตสิทธิ์ของบทบาทนี้': 'Location hidden — outside this role’s permissions',
  'เห็นตำแหน่งช่าง': 'See the technician’s location', 'แผนที่': 'Map', 'เปิดแผนที่': 'Open map',
  '— แตะเพื่อดูแผนที่': '— tap to open the map', 'กม. · ประมาณ': 'km · about',
  'ช่างจะถึงในไม่ช้า': 'The technician will arrive shortly', 'ติดตามได้ที่': 'Follow along at',
  '— เราจะแจ้งเมื่อช่างออกเดินทาง': '— we will tell you when the technician sets off',
  'ดูสถานะงาน': 'See job status', 'ขาดการเชื่อมต่อ': 'Disconnected',

  /* ทีมช่าง */
  'เพิ่มช่าง': 'Add technician', 'แก้ไขข้อมูลช่าง': 'Edit technician', 'ลบช่าง': 'Remove technician',
  'เพิ่ม / ลบช่าง': 'Add / remove technicians', 'ยังไม่มีช่าง — กด + เพิ่มช่าง': 'No technicians yet — press + to add one',
  'ยังไม่มีช่างในทีม': 'No technicians in the team', 'ภาระงานของช่าง': 'Technician workload',
  'ความถนัด': 'Skills', 'ถนัดงาน': 'Skilled in', 'ยังไม่ระบุความถนัด': 'No skills set',
  'ช่างคนนี้จะเข้าระบบไม่ได้อีก ประวัติงานเดิมยังอยู่ครบ': 'This technician can no longer sign in; their job history is kept',
  'คนนี้จะเข้าระบบไม่ได้อีก ประวัติงานเดิมยังอยู่ครบ': 'They can no longer sign in; their job history is kept',
  'มีงาน/โปรเจกต์ค้าง': 'still has open jobs or projects',
  'รายการ — ย้ายให้คนอื่นก่อนจึงลบได้': 'items — reassign them before removing this person',
  'ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน': 'There must be at least one administrator',
  'เบอร์นี้มีในระบบแล้ว': 'That phone number is already in use',
  'เบอร์โทรไม่ถูกต้อง': 'Invalid phone number', 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)': 'Invalid phone number (e.g. 0812345678)',
  'กรุณากรอกชื่อ': 'Please enter a name', 'ช่างผู้ดูแลงานของคุณ': 'Your technician', 'ช่างผู้ปฏิบัติงาน': 'Technician',
  'ช่างที่รับผิดชอบเป็นผู้อัปเดตขั้นตอน': 'The assigned technician updates the steps',
  'เห็นงานของช่างคนอื่น': 'See other technicians’ jobs',

  /* โปรเจกต์ */
  'สร้างโปรเจกต์': 'New project', 'สร้างโปรเจกต์แล้ว': 'Project created', 'ชื่อโปรเจกต์': 'Project name',
  'กรุณากรอกชื่อโปรเจกต์': 'Please enter a project name', 'เช่น ติดตั้งกล้องวงจรปิด 8 จุด': 'e.g. install 8 CCTV cameras',
  'ขั้นตอนงาน (บรรทัดละ 1 ขั้น)': 'Steps (one per line)', 'ขั้นตอนใหม่': 'New step', 'เพิ่มขั้นตอน': 'Add step',
  'เพิ่มขั้นตอน…': 'Add a step…', 'ยังไม่มีขั้นตอน': 'No steps yet',
  'สำรวจหน้างาน&#10;เดินสาย&#10;ติดตั้ง&#10;ส่งมอบ': 'Site survey\nCabling\nInstallation\nHandover',
  'กำหนดเสร็จ': 'Due', 'กรุณาเลือกวันกำหนดเสร็จ': 'Please choose a due date', 'แล้วเสร็จ': 'completed',
  'ไม่มีโปรเจกต์': 'No projects', 'ไม่พบโปรเจกต์': 'Project not found', 'ไม่มีโปรเจกต์ที่กำลังทำ': 'No projects in progress',
  'โปรเจกต์ของบริษัท': 'Company projects', 'โปรเจกต์เสร็จแล้ว': 'Project completed',
  'งานติดตั้งและผู้รับผิดชอบ': 'Installation work and owners', 'ดูโปรเจกต์': 'See projects',
  'ได้รับมอบหมายโปรเจกต์': 'Assigned to a project', 'ที่รับผิดชอบ': 'they own',

  /* พาร์ทเนอร์ */
  'พาร์ทเนอร์และสถานที่': 'Partners and sites', 'เพิ่มพาร์ทเนอร์': 'Add partner', 'แก้ไขพาร์ทเนอร์': 'Edit partner',
  'จัดการพาร์ทเนอร์': 'Manage partners', 'จัดการพาร์ทเนอร์และสถานที่': 'Manage partners and sites',
  'จัดการพาร์ทเนอร์ / สถานที่': 'Manage partners / sites', 'ค้นหาพาร์ทเนอร์': 'Search partners',
  'ค้นหาชื่อ สถานที่ หรือที่อยู่…': 'Search name, site or address…', 'ไม่พบพาร์ทเนอร์ที่ตรงเงื่อนไข': 'No partners match',
  'ชื่อบริษัท / องค์กร': 'Company / organisation name', 'เช่น บริษัท ตัวอย่าง จำกัด': 'e.g. Example Co., Ltd.',
  'กรุณากรอกชื่อพาร์ทเนอร์': 'Please enter the partner name', 'รูปแบบสัญญา': 'Contract type',
  'สัญญาดูแลรายปี (MA)': 'Annual maintenance (MA)', 'บริการรายครั้ง': 'Pay per call',
  'ผู้ติดต่อหลัก': 'Main contact', 'ผู้ติดต่อ': 'Contact', 'ผู้ติดต่อ:': 'Contact:', 'ผู้ติดต่อที่สถานที่': 'Site contact',
  'อีเมลตัวแทนบริษัท': 'Company representative’s email',
  'ผู้ติดต่อหลักใช้อีเมลนี้เข้าระบบ และอนุมัติพนักงาน': 'The main contact signs in with this email and approves staff',
  'กรุณากรอกชื่อผู้ติดต่อหลัก (ตัวแทนบริษัท)': 'Please enter the main contact (company representative)',
  'เพิ่มตัวแทนบริษัท': 'Added a company representative', 'แล้ว — ตัวแทนเข้าระบบด้วย': '— the representative signs in with',
  'สถานที่ที่ดูแล': 'Sites we look after', 'สถานที่แรก': 'First site', 'เพิ่มสถานที่': 'Add site',
  'แก้ไขสถานที่': 'Edit site', 'ชื่อสถานที่': 'Site name', 'บันทึกสถานที่แล้ว': 'Site saved',
  'เช่น สำนักงานใหญ่': 'e.g. Head office', 'เช่น สาขาบางนา': 'e.g. Bangna branch',
  'ที่อยู่': 'Address', 'เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์': 'Number, street, sub-district, district, province, postcode',
  'กรุณากรอกชื่อและที่อยู่': 'Please enter a name and address',
  'กรุณากรอกชื่อและที่อยู่ของสถานที่แรก': 'Please enter the name and address of the first site',
  'ยังไม่มีสถานที่': 'No sites yet', 'ทุกพาร์ทเนอร์': 'All partners', 'ลูกค้า / พาร์ทเนอร์': 'Customer / partner',
  'กรุณาเลือกบริษัท': 'Please choose a company',
  'เพิ่มพาร์ทเนอร์ก่อน แล้วจึงเพิ่มลูกค้าของบริษัทนั้น': 'Add a partner first, then add that company’s customers',
  'ดูแลอยู่': 'under contract', 'สถานที่ จาก': 'sites from', 'แยกตามพาร์ทเนอร์': 'By partner', 'สรุปตามพาร์ทเนอร์': 'Summary by partner',

  /* รายงาน */
  'รายงานผลงาน': 'Performance report', 'รายงานสรุปผลงาน': 'Summary report', 'สรุปผลงาน': 'Summary',
  'รายงานสรุปผลการให้บริการ': 'Service summary report', 'รายงานผลงานของพาร์ทเนอร์นี้': 'Performance report for this partner',
  'สรุปงานที่ทำ พร้อมพิมพ์ส่งลูกค้า': 'A summary of the work, ready to print for the customer',
  'โหมดกลางคืน': 'Night mode', 'โหมดกลางวัน': 'Day mode', 'ภาษาไทย': 'Thai', 'Switch to English': 'Switch to English',
  'ผลงาน 7 วัน': 'Last 7 days', '7 วันล่าสุด': 'Last 7 days', '30 วันล่าสุด': 'Last 30 days', '90 วันล่าสุด': 'Last 90 days',
  'ช่วงเวลา': 'Period', 'ยังไม่มีงานที่ทำเสร็จในช่วงนี้': 'No jobs completed in this period',
  'ไม่มีข้อมูลในช่วงนี้': 'No data for this period', 'พิมพ์รายงานสรุป': 'Print summary',
  'พิมพ์ / PDF': 'Print / PDF', 'พิมพ์': 'Print', '· พิมพ์เมื่อ': '· printed', 'ดาวน์โหลด CSV': 'Download CSV',
  'ดาวน์โหลด CSV แล้ว (เปิดด้วย Excel ได้)': 'CSV downloaded (opens in Excel)',
  'ดู / พิมพ์รายงานสรุป': 'View / print summary reports', 'เลขที่': 'No.', 'เลขที่งาน': 'Job no.', 'เลขที่รายงาน': 'Report no.',
  'วันที่': 'Date', 'วันที่เสร็จ': 'Completed on', 'งาน / ผลการดำเนินงาน': 'Jobs / results',
  'เอกสารนี้สร้างจากระบบ Guru IT Service Desk · สถานะ:': 'Generated by Guru IT Service Desk · status:',
  'เอกสารนี้สร้างจากระบบ Guru IT Service Desk · ใบรายงานแต่ละฉบับพร้อมลายเซ็นลูกค้าเปิดดูได้ในระบบ · พิมพ์เมื่อ': 'Generated by Guru IT Service Desk · each report with its customer signature can be opened in the system · printed',
  'ทุกการกระทำถูกบันทึกและแก้ไขไม่ได้': 'Every action is logged and cannot be changed',
  'ดูบันทึกตรวจสอบ': 'See the audit log', 'เหตุการณ์ล่าสุด': 'Recent events', 'ยังไม่มีเหตุการณ์': 'No events yet',
  'รายงานสรุปผลงาน': 'Performance summary', 'เห็นงาน': 'See jobs', 'เห็นงานทั้งหมด': 'See every job',
  'งานของตัวเอง': 'their own jobs', 'งานของบริษัท': 'their company’s jobs', 'ของบริษัท': 'their company’s',
  'ของตัวเอง': 'their own', 'ในทีม': 'in their team', 'ตัวเอง': 'themselves',

  /* การแจ้งเตือน */
  'การแจ้งเตือน': 'Notifications', 'ยังไม่มีการแจ้งเตือน': 'No notifications yet', 'ยังไม่อ่าน': 'unread',
  'อ่านแล้วทั้งหมด': 'Mark all as read', 'งานใหม่': 'New job', 'เรื่องร้องเรียนใหม่': 'New complaint',
  'ได้รับมอบหมายงาน': 'You have been assigned a job',
  'เปิดการแจ้งเตือนบนเครื่องนี้': 'Turn on notifications on this device',
  'เปิดการแจ้งเตือนบนเครื่องนี้แล้ว': 'Notifications are on for this device',
  'เด้งเตือนพร้อมเสียงเมื่อมีงานใหม่': 'Pop up with a sound when a new job arrives',
  'เด้งเตือนบนเครื่องนี้: เปิดอยู่': 'Device notifications: on',
  'แตะเพื่อเปิดเด้งเตือนบนเครื่องนี้': 'Tap to turn on notifications for this device',
  'ยังไม่ได้อนุญาตการแจ้งเตือน — เปิดได้ในการตั้งค่าเบราว์เซอร์': 'Notifications are blocked — turn them on in your browser settings',
  'เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน': 'This browser does not support notifications',
  'เบราว์เซอร์นี้แจ้งเตือนได้เฉพาะในแอป': 'This browser can only notify you inside the app',

  /* หน้า "ฉัน" / ตั้งค่า */
  'การแสดงผล': 'Display', 'โหมดสี': 'Colour mode', 'กลางวัน': 'Day', 'กลางคืน': 'Night', 'ภาษา': 'Language',
  'มุมมองรายการ': 'List view', 'แบบย่อ — แถวเดียว': 'Compact — one line', 'แบบเต็ม — แสดงรายละเอียด': 'Full — with details',
  'ย่อรายการ (แสดงแบบสั้น)': 'Compact list', 'ขยายรายการ (แสดงรายละเอียด)': 'Full list',
  'ย่อ / ขยายทั้งหมด': 'Collapse / expand all', 'ย่อทั้งหมดแล้ว': 'All collapsed', 'ขยายทั้งหมดแล้ว': 'All expanded',
  'บัญชี': 'Account', 'จัดการ': 'Manage', 'จัดการผู้ใช้และสิทธิ์': 'Manage users and permissions',
  'ข้อมูลในเครื่องนี้': 'Data on this device', 'สำรองข้อมูล': 'Back up data',
  'ดาวน์โหลดไฟล์ไว้กันข้อมูลหาย': 'Download a file so nothing is lost',
  'ดาวน์โหลดไฟล์สำรองแล้ว — เก็บไว้ที่ปลอดภัย': 'Backup downloaded — keep it somewhere safe',
  'กู้คืนจากไฟล์สำรอง': 'Restore from a backup', 'แทนที่ข้อมูลทั้งหมดในเครื่องนี้': 'Replaces all data on this device',
  'กู้คืน': 'Restore', 'กู้คืนข้อมูล?': 'Restore data?',
  'ข้อมูลทั้งหมดในเครื่องนี้จะถูกแทนที่ด้วยไฟล์': 'All data on this device will be replaced by the file',
  'งาน) และต้องเข้าสู่ระบบใหม่': 'jobs) and you will have to sign in again',
  'ไฟล์นี้ไม่ใช่ไฟล์สำรองของระบบ': 'That is not a backup file from this system',
  'พื้นที่ในเครื่องไม่พอสำหรับไฟล์นี้': 'Not enough space on this device for that file',
  'บันทึกไม่สำเร็จ: พื้นที่ในเครื่องเต็ม — สำรองข้อมูลแล้วลบรูปที่ไม่จำเป็น': 'Save failed: this device is out of space — back up, then delete photos you do not need',
  'เฉพาะผู้ดูแลระบบ': 'Administrators only', 'ดูแลระบบ ผู้ใช้ และสิทธิ์': 'Look after the system, users and permissions',
  'ดูผู้ใช้และตารางสิทธิ์': 'View users and the permissions table', 'ยังไม่มีอีเมล': 'no email yet',

  /* บทบาท: เป้าหมาย/สิทธิ์ */
  'แจ้งปัญหา ติดตามงาน และเซ็นรับงาน': 'Report issues, follow jobs and sign them off',
  'แจ้งปัญหา (พิมพ์ / พูด / แนบรูป)': 'Report issues (type / speak / attach photos)',
  'ติดตามว่าช่างถึงไหนแล้ว': 'See where the technician is',
  'ทำงานที่ได้รับมอบหมายให้เสร็จ': 'Finish the jobs they are assigned',
  'กระจายงานและดูแลทีมให้ทันเวลา': 'Spread the work and keep the team on time',
  'บันทึก Work log': 'Keep a work log', 'และเซ็นรับงาน': 'and sign off',
  'อนุมัติพนักงานใหม่ของบริษัท': 'Approve the company’s new staff',

  /* อื่น ๆ */
  'สวัสดี คุณ': 'Hello, ', 'สวัสดี': 'Hello', 'ระบบ': 'System', 'หน้าต่าง': 'window', 'แผนที่จำลอง': 'simplified map',
  '· แผนที่จำลอง': '· simplified map', 'กำหนด': 'due', 'ทำงานที่': 'Works at',
  'ยังไม่เข้าสู่ระบบ': 'Not signed in', 'กำลังตรวจสอบและแก้ไข': 'Checking and fixing',
  'จะเริ่มดำเนินการเร็ว ๆ นี้': 'Starting shortly', 'รอหัวหน้าทีมมอบหมายช่าง': 'Waiting for a team leader to assign a technician',
  /* รอบปรับปรุง: เรียงงาน · ลืมรหัสผ่าน · สมัครด้วยรหัสบริษัท · ตารางงาน MA ประจำเดือน */
  'เรียงตามความสำคัญ': 'Sort by priority', 'วันที่แจ้ง (เก่าสุดก่อน)': 'Submitted date (oldest first)', 'เรียงงานตาม': 'Sort jobs by',
  'ลืมรหัสผ่าน?': 'Forgot password?', 'ลืมรหัสผ่าน': 'Forgot password', 'ส่งลิงก์ทางอีเมล': 'Email me a reset link',
  'วิธีที่ 1 — รับลิงก์ตั้งรหัสใหม่ทางอีเมลที่ลงทะเบียนไว้': 'Option 1 — get a reset link by email',
  'วิธีที่ 2 — ติดต่อผู้ดูแลระบบให้ตั้งรหัสใหม่ให้': 'Option 2 — contact the administrator to reset it for you',
  'ถ้ามีบัญชีที่ใช้อีเมลนี้ ระบบจะส่งลิงก์ตั้งรหัสใหม่ไปให้ (ลิงก์ใช้ได้ 30 นาที) — ไม่ได้รับ? ติดต่อผู้ดูแลระบบด้านล่าง': 'If an account uses this email, we will send a reset link (valid for 30 minutes). Not received? Contact the administrator below.',
  'ตั้งรหัสผ่านใหม่': 'Set a new password', 'รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)': 'New password (at least 8 characters)', 'พิมพ์อีกครั้ง': 'Type it again',
  'บันทึกรหัสผ่านใหม่': 'Save new password', 'กลับหน้าเข้าสู่ระบบ': 'Back to sign in', 'รหัสผ่านทั้งสองช่องไม่ตรงกัน': 'The two passwords do not match',
  'ตั้งรหัสผ่านใหม่แล้ว — เข้าสู่ระบบด้วยรหัสใหม่ได้เลย': 'Password updated — sign in with the new password',
  'ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุ/ใช้ไปแล้ว — ขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ': 'The reset link is invalid, expired or already used — request a new one from the sign-in page',
  'ลงชื่อเข้าใช้': 'Request access', 'รหัสบริษัท': 'Company ID', 'ขอรหัสจากตัวแทนบริษัทของคุณ': 'Ask your company representative for the ID',
  'ถัดไป': 'Next', 'กรุณากรอกรหัสบริษัท': 'Please enter the company ID', 'ไม่พบรหัสบริษัทนี้ — ตรวจรหัสอีกครั้ง': 'Company ID not found — please check it',
  'ลงชื่อเข้าใช้ครั้งแรกด้วยรหัสบริษัท (ตัวแทนบริษัทของคุณยืนยันก่อนจึงใช้งานได้) หรือขอลิงก์สมัครจากตัวแทนบริษัท': 'First-time access with your company ID (your company representative must approve before you can sign in), or ask your representative for an invite link',
  'ตารางงาน MA': 'MA schedules', 'MA ประจำเดือน': 'Monthly MA', 'เพิ่มตารางงาน MA': 'Add MA schedule', 'แก้ไขตารางงาน MA': 'Edit MA schedule',
  'ชื่องาน': 'Task name', 'รายละเอียด (ช่างเห็น)': 'Description (visible to technicians)', 'วันที่ของเดือน': 'Day of month', 'เวลาเริ่ม': 'Start time',
  'ทุกสถานที่': 'All sites', 'ผู้รับผิดชอบ (ช่าง)': 'Responsible technician', 'ยังไม่กำหนด': 'Not assigned', 'ความสำคัญ': 'Priority',
  'เปิดใช้งาน (ปิด = พัก ไม่สร้างงานใหม่)': 'Active (off = paused, no new jobs are created)', 'ใช้งาน': 'Active', 'พักอยู่': 'Paused', 'พัก': 'Pause', 'เปิดใช้งาน': 'Resume',
  'รอบ': 'Schedule', 'ครั้งถัดไป': 'Next run', 'งานล่าสุด': 'Latest job', 'ผู้รับผิดชอบ': 'Responsible', 'สถานที่': 'Site',
  '(เดือนสั้นใช้วันสุดท้าย)': '(short months use the last day)', 'สร้างที่ถึงกำหนดตอนนี้': 'Create due jobs now',
  'ยังไม่มีตารางงาน MA — เพิ่มเพื่อให้ระบบสร้างงานให้ทุกเดือน': 'No MA schedules yet — add one so jobs are created every month',
  'บันทึกตารางงาน MA แล้ว': 'MA schedule saved', 'พักตารางงานแล้ว': 'Schedule paused', 'เปิดใช้งานแล้ว': 'Schedule resumed', 'กรุณากรอกชื่องาน': 'Please enter a task name',
  'วันที่ของเดือนต้องเป็น 1–31': 'Day of month must be 1–31', 'ยังไม่ได้รัน migration 005 ในฐานข้อมูล (ดู TODO.md)': 'Database migration 005 has not been run yet (see TODO.md)',
  'ไม่มีงานที่ถึงกำหนดและยังไม่ได้สร้าง': 'No due jobs left to create',

  'ส่งคำขอแล้ว — ตัวแทนบริษัทของคุณจะยืนยัน เมื่อยืนยันแล้วเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้': 'Request sent — your company representative will confirm it. Once confirmed, sign in with your email and password.',
  'เบอร์โทร (ไม่บังคับ)': 'Phone (optional)', 'รหัสผ่านที่ใช้เข้าระบบ (อย่างน้อย 8 ตัว)': 'Password for signing in (at least 8 characters)',
  'ตัวแทนบริษัทจะยืนยันว่าคุณเป็นพนักงานจริงก่อนเข้าใช้งาน': 'Your company representative will confirm you are an employee before you can sign in',

  'ความสำคัญ': 'Priority', 'วันที่แจ้ง · เก่าสุดก่อน': 'Submitted · oldest first',

};

/* คีย์ยาวก่อน เพื่อไม่ให้คำสั้นไปตัดคำยาว */
const EN_KEYS = Object.keys(EN).filter(k => !WHOLE_ONLY.has(k)).sort((a, b) => b.length - a.length);
const EN_RE = new RegExp(EN_KEYS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
const toEN = s => EN[s.trim()] !== undefined && EN[s.trim()] !== null ? s.replace(s.trim(), EN[s.trim()]) : s.replace(EN_RE, m => EN[m]);
console.assert(toEN('บันทึก') === 'Save' && toEN('T-1001 · แจ้ง เมื่อสักครู่') === 'T-1001 · reported just now'
  && toEN('บริษัท ทดสอบ จำกัด') === 'บริษัท ทดสอบ จำกัด' && toEN('บริษัท') === 'Company'
  && toEN('ยังไม่มีงานที่ทำเสร็จในช่วงนี้') === 'No jobs completed in this period', 'toEN');

/* แปลข้อความและป้ายกำกับที่วาดไว้แล้ว — เรียกซ้ำได้ เพราะข้อความที่แปลแล้วไม่มีคำไทยเหลือ */
const TR_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const hasThai = s => /[฀-๿]/.test(s);
function translateTree(root) {
  if (lang !== 'en' || !root) return;
  if (root.nodeType === 1) {
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const a of TR_ATTRS) { const v = el.getAttribute?.(a), t = v && hasThai(v) ? toEN(v) : v; if (t !== v) el.setAttribute(a, t); }
    }
  }
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const todo = [];
  for (let n = root.nodeType === 3 ? root : w.nextNode(); n; n = w.nextNode()) if (hasThai(n.nodeValue)) todo.push(n);
  todo.forEach(n => { const v = toEN(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
}
/* ดักทุกจุดที่แอปวาดหน้าจอใหม่ จึงไม่ต้องแก้โค้ดเดิมทีละจุด */
new MutationObserver(ms => {
  if (lang !== 'en') return;
  for (const m of ms) {
    /* เขียนเฉพาะตอนข้อความเปลี่ยนจริง — เขียนค่าเดิมซ้ำจะเกิด mutation วนไม่รู้จบ */
    if (m.type === 'characterData') { const v = toEN(m.target.nodeValue); if (v !== m.target.nodeValue) m.target.nodeValue = v; }
    else m.addedNodes.forEach(translateTree);
  }
}).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

/* ปุ่มสลับภาษา: ต้องเป็นฟังก์ชัน เพราะ onclick ของปุ่มจะเห็นคุณสมบัติ lang ของตัวปุ่มแทนตัวแปร lang */
function toggleLang() { setLang(lang === 'en' ? 'th' : 'en'); }
function setLang(v) {
  lang = v === 'en' ? 'en' : 'th';
  try { localStorage.setItem('gitsd-lang', lang); } catch { /* โหมดส่วนตัว */ }
  document.documentElement.lang = lang;
  renderAll();                       // วาดภาษาไทยใหม่ แล้ว observer แปลเป็นอังกฤษถ้าเลือกไว้
  translateTree(document.body);
}
document.documentElement.lang = lang;
