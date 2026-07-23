
/* ============================================================
   GEC ARSIKERE — STUDENT MANAGEMENT PORTAL
   Firebase backend: Firestore + Auth + Storage
   Real-time sync across all devices via onSnapshot
   ============================================================ */

const ADMIN_EMAIL = "admin@gecarsikere.edu";
const ADMIN_PWD  = "GECARSIKERE2026";
const API_URL = "https://api.anthropic.com/v1/messages";
const API_MODEL = "claude-sonnet-4-6";

const firebaseConfig = {
  apiKey: "AIzaSyC_fS0oOdfE3EBvBa0HrBBNlXo2-f6D248",
  authDomain: "geca-2026-4e046.firebaseapp.com",
  projectId: "geca-2026-4e046",
  storageBucket: "geca-2026-4e046.firebasestorage.app",
  messagingSenderId: "58397918103",
  appId: "1:58397918103:web:956609706b663d847fbad2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
db.enablePersistence({synchronizeTabs:true}).catch(()=>{});

/* ---------- Syllabus data ---------- */
const SYLLABUS = {
  CSE:{
    1:["Engg. Mathematics-I","Engg. Physics","C Programming","Basic Electrical Engg.","Engg. Chemistry","Engg. Graphics"],
    2:["Engg. Mathematics-II","Data Structures","Digital Electronics","OOP with Java","Computer Organization","Soft Skills"],
    3:["Discrete Mathematics","Design & Analysis of Algorithms","DBMS","Operating Systems","Computer Networks","Web Technologies"],
    4:["Software Engineering","Microprocessors","Compiler Design","Computer Graphics","Elective-I","Mini Project"],
    5:["Theory of Computation","Artificial Intelligence","Cloud Computing","Machine Learning","Elective-II","Seminar"],
    6:["Cryptography & Network Security","Big Data Analytics","IoT Systems","Deep Learning","Elective-III","Project Phase-I"],
    7:["Distributed Systems","Blockchain","DevOps","Elective-IV","Internship","Project Phase-II"],
    8:["Research Methodology","Professional Ethics","Elective-V","Major Project","Placement Training"]
  },
  ISE:{
    1:["Engg. Mathematics-I","Engg. Physics","C Programming","Basic Electrical Engg.","Engg. Chemistry","Engg. Graphics"],
    2:["Engg. Mathematics-II","Data Structures","Digital Electronics","OOP with Java","Computer Organization","Soft Skills"],
    3:["Discrete Mathematics","Design & Analysis of Algorithms","DBMS","Operating Systems","Information Security","Web Technologies"],
    4:["Software Engineering","System Software","Compiler Design","Elective-I","Mini Project","Computer Graphics"],
    5:["Information Retrieval","Artificial Intelligence","Cloud Computing","Network Security","Elective-II","Seminar"],
    6:["Big Data Analytics","Cyber Security","IoT Systems","Deep Learning","Elective-III","Project Phase-I"],
    7:["Digital Forensics","Blockchain","DevOps","Elective-IV","Internship","Project Phase-II"],
    8:["Research Methodology","Professional Ethics","Elective-V","Major Project","Placement Training"]
  },
  EC:{
    1:["Engg. Mathematics-I","Engg. Physics","C Programming","Basic Electrical Engg.","Engg. Chemistry","Engg. Graphics"],
    2:["Engg. Mathematics-II","Data Structures","Digital Electronics","C++ & Signals & Systems","Computer Organization","Soft Skills"],
    3:["Analog Electronics","Digital Signal Processing","Electromagnetic Theory","Communication Theory","Microcontrollers","HDL Programming"],
    4:["VLSI Design","Antenna Theory","Wireless Communication","Embedded Systems","Elective-I","Mini Project"],
    5:["RF & Microwave Engg.","Optical Fiber Comm.","Digital Image Processing","MEMS","Elective-II","Seminar"],
    6:["Radar & Navigation","Satellite Communication","Biomedical Electronics","IoT Systems","Elective-III","Project Phase-I"],
    7:["5G Technologies","Robotics","Elective-IV","Internship","Project Phase-II"],
    8:["Research Methodology","Professional Ethics","Elective-V","Major Project","Placement Training"]
  },
  AIML:{
    1:["Engg. Mathematics-I","Engg. Physics","Python Programming","Basic Electrical Engg.","Engg. Chemistry","Engg. Graphics"],
    2:["Linear Algebra","Data Structures","Digital Electronics","Probability & Statistics","Computer Organization","Soft Skills"],
    3:["Discrete Mathematics","Design & Analysis of Algorithms","DBMS","Machine Learning Basics","Data Visualization","Web Technologies"],
    4:["Supervised Learning","Unsupervised Learning","Computer Vision","NLP Fundamentals","Elective-I","Mini Project"],
    5:["Deep Learning","Reinforcement Learning","Big Data Analytics","AI Ethics","Elective-II","Seminar"],
    6:["Generative AI","Speech Processing","Cloud AI Services","MLOps","Elective-III","Project Phase-I"],
    7:["Advanced NLP","AI in Healthcare","Elective-IV","Internship","Project Phase-II"],
    8:["Research Methodology","Professional Ethics","Elective-V","Major Project","Placement Training"]
  }
};

const BRANCH_COLOR = {CSE:"#4a9eff", ISE:"#34d399", EC:"#f87171", AIML:"#a78bfa"};
const BRANCHES = ["CSE","ISE","EC","AIML"];
const SECTIONS = ["A","B","C"];

/* ---------- In-memory cache (kept in sync by onSnapshot) ---------- */
let DB = {students:[],pending:[],faculty:[],announcements:[],assignments:[],attendance:[],messages:[],marks:[],timetable:[],materials:[],calendar:[]};
let currentUser = null;
let activeTab = null;
let chatTarget = null;
let unsubscribers = [];
let authReady = false;

/* ---------- Real-time listeners ---------- */
function startListeners(){
  unsubscribers.forEach(u=>{try{u()}catch(e){}});
  unsubscribers = [];

  unsubscribers.push(
    db.collection("students").onSnapshot(snap=>{
      DB.students = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("pendingStudents").onSnapshot(snap=>{
      DB.pending = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("faculty").onSnapshot(snap=>{
      DB.faculty = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("announcements").onSnapshot(snap=>{
      DB.announcements = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("assignments").onSnapshot(snap=>{
      DB.assignments = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("attendance").onSnapshot(snap=>{
      DB.attendance = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("marks").onSnapshot(snap=>{
      DB.marks = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("timetable").onSnapshot(snap=>{
      DB.timetable = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("materials").onSnapshot(snap=>{
      DB.materials = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  unsubscribers.push(
    db.collection("calendar").onSnapshot(snap=>{
      DB.calendar = snap.docs.map(d=>({id:d.id,...d.data()}));
      if(activeTab) refreshCurrentTab();
    })
  );
  if(currentUser && currentUser.role==='student'){
    unsubscribers.push(
      db.collection("messages").where("studentId","==",currentUser.obj.id).onSnapshot(snap=>{
        DB.messages = snap.docs.map(d=>({id:d.id,...d.data()}));
        if(activeTab==='s_chat') renderSChat(document.getElementById('mainContent'));
      })
    );
  } else {
    DB.messages = [];
  }
}

function refreshCurrentTab(){
  if(!activeTab||!currentUser)return;
  const mc=document.getElementById('mainContent');
  if(!mc)return;
  if(currentUser.role==='admin')renderAdmin(activeTab,mc);
  else if(currentUser.role==='faculty')renderFaculty(activeTab,mc);
  else renderStudent(activeTab,mc);
  const sb=document.getElementById('sidebar');
  if(sb) sb.innerHTML=sideContent();
  document.querySelectorAll('#navList button').forEach(b=>{
    b.classList.remove('active','activeTeal');
    if(b.getAttribute('data-tab')===activeTab){
      b.classList.add(currentUser.role==='faculty'?'activeTeal':'active');
    }
  });
}

/* ---------- Seed default announcements ---------- */
async function seedAnnouncements(){
  try{
    const snap = await db.collection("announcements").limit(1).get();
    if(!snap.empty)return;
    const now = Date.now();
    await db.collection("announcements").doc("a1").set({
      title:"Welcome to GEC Arsikere Portal!",
      body:"Official Student Management System. All students please register and await admin approval.",
      type:"general",branch:"All",pinned:true,author:"Admin",date:now
    });
    await db.collection("announcements").doc("a2").set({
      title:"Semester Examination Schedule",
      body:"End semester examinations are scheduled. Check timetable on notice board.",
      type:"exam",branch:"All",pinned:false,author:"Examination Cell",date:now-86400000
    });
  }catch(e){console.warn("Seed skip:",e);}
}

/* ---------- Utils ---------- */
function uid(p){return p+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);}
function today(){const d=new Date();const m=String(d.getMonth()+1).padStart(2,'0');const da=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+da;}
function initials(name){if(!name)return "?";const parts=name.trim().split(/\s+/);let r=parts.map(x=>x[0]).join("").toUpperCase();return r.slice(0,2);}
function esc(s){if(s==null)return "";return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(ts){const d=new Date(ts);return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});}
function fmtTime(ts){const d=new Date(ts);return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});}

function av(initialsText, size, color){
  const c = color || pickColor(initialsText);
  return `<div class="av" style="width:${size}px;height:${size}px;background:${c};font-size:${Math.round(size*0.38)}px">${esc(initialsText)}</div>`;
}
function pickColor(seed){
  const colors=["#4a9eff","#0e9f8a","#d97706","#a78bfa","#f87171","#2563eb","#1a9e6d","#c9922a","#0d6b4f","#5b3fb0"];
  let h=0;const s=String(seed);for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);
  return colors[Math.abs(h)%colors.length];
}
function badge(text, cls){return `<span class="badge ${cls||'b-navy'}">${esc(text)}</span>`;}
function branchBadge(b){const m={CSE:"b-cse",ISE:"b-ise",EC:"b-ec",AIML:"b-aiml"};return badge(b, m[b]||"b-navy");}

function toast(msg, type){
  const t=document.createElement('div');
  t.className='toast '+(type==='err'?'err':'ok');
  t.innerHTML=(type==='err'?'⚠ ':'✓ ')+esc(msg);
  document.getElementById('toasts').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(40px)';setTimeout(()=>t.remove(),250);},3000);
}

/* ---------- Attendance ---------- */
function subjectsFor(branch, sem){return SYLLABUS[branch] ? (SYLLABUS[branch][sem]||[]) : [];}

function calcAtt(studentId, branch, sem){
  const subs = subjectsFor(branch, sem);
  const result=[];
  for(const sub of subs){
    let present=0,total=0;
    for(const a of DB.attendance){
      if(a.studentId===studentId && a.subject===sub){
        total++;
        if(a.status==="present")present++;
      }
    }
    if(total>0){ result.push({sub, pct:Math.round(present/total*100), present, total}); }
  }
  return result;
}
function overallAtt(studentId, branch, sem){
  const arr=calcAtt(studentId, branch, sem);
  if(arr.length===0)return null;
  return Math.round(arr.reduce((s,x)=>s+x.pct,0)/arr.length);
}
function subjectPct(studentId, subject){
  let present=0,total=0;
  for(const a of DB.attendance){
    if(a.studentId===studentId && a.subject===subject){
      total++;
      if(a.status==="present")present++;
    }
  }
  if(total===0)return null;
  return {pct:Math.round(present/total*100),present,total};
}

/* ---------- Marks helpers ---------- */
function marksFor(studentId, subject){
  return DB.marks.filter(m=>m.studentId===studentId && m.subject===subject).sort((a,b)=>b.date-a.date);
}
function allMarksFor(studentId){
  return DB.marks.filter(m=>m.studentId===studentId).sort((a,b)=>b.date-a.date);
}
function avgMarks(studentId, subject){
  const arr=marksFor(studentId,subject);
  if(arr.length===0)return null;
  let tot=0,sco=0;
  arr.forEach(m=>{tot+=m.maxMarks;sco+=m.scoredMarks;});
  return tot===0?null:Math.round(sco/tot*100);
}

/* ---------- Timetable helpers ---------- */
const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function timetableFor(branch, sem){
  return DB.timetable.filter(t=>t.branch===branch && t.sem===sem).sort((a,b)=>a.period-b.period);
}
function timetableByDay(branch, sem, day){
  return timetableFor(branch,sem).filter(t=>t.day===day).sort((a,b)=>a.period-b.period);
}

/* ---------- Profile Modal ---------- */
let _pmStudent=null;
function openPM(student){
  _pmStudent=student;
  const branch=student.branch, sem=student.sem;
  const att=calcAtt(student.id, branch, sem);
  const overall=overallAtt(student.id, branch, sem);
  let rows='';
  const subs=subjectsFor(branch,sem);
  for(const sub of subs){
    const found=att.find(x=>x.sub===sub);
    if(found){
      const color = found.pct>=75?'var(--success)':'var(--danger)';
      rows+=`<tr><td><b>${esc(sub)}</b></td>
        <td><div class="bar"><span style="width:${found.pct}%;background:${color}"></span></div></td>
        <td><b style="color:${color}">${found.pct}%</b></td>
        <td>${found.present}/${found.total}</td></tr>`;
    } else {
      rows+=`<tr><td>${esc(sub)}</td><td colspan="3" style="font-style:italic;color:var(--muted)">No data yet</td></tr>`;
    }
  }
  const modal=document.createElement('div');
  modal.className='overlay';modal.id='profModal';
  modal.innerHTML=`<div class="modal">
    <div class="modalHead"><h3>Student Profile</h3><button class="x" onclick="closePM()">✕</button></div>
    <div class="modalBody">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        ${av(initials(student.name),56,BRANCH_COLOR[branch]||pickColor(student.name))}
        <div><div style="font-size:18px;font-weight:700;color:var(--navy)">${esc(student.name)}</div>
        <div style="font-size:13px;color:var(--muted)">${esc(student.usn)}</div>
        <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">${branchBadge(branch)}${badge("Sem "+sem,"b-info")}${badge("Sec "+student.section,"b-navy")}${badge("✓ Approved","b-success")}</div></div>
      </div>
      <div class="grid2" style="margin-bottom:16px">
        <div><div class="lbl">Email</div><div style="font-size:13px">${esc(student.email)}</div></div>
        <div><div class="lbl">Phone</div><div style="font-size:13px">${esc(student.phone)}</div></div>
        <div><div class="lbl">Date of Birth</div><div style="font-size:13px">${esc(student.dob)}</div></div>
        <div><div class="lbl">Address</div><div style="font-size:13px">${esc(student.address)}</div></div>
        <div><div class="lbl">Father's Name</div><div style="font-size:13px">${esc(student.fatherName)}</div></div>
        <div><div class="lbl">Mother's Name</div><div style="font-size:13px">${esc(student.motherName)}</div></div>
      </div>
      <h3 style="margin-bottom:10px">Subject-wise Attendance ${overall!=null?`<span class="badge b-${overall>=75?'success':'danger'}" style="margin-left:8px">Overall ${overall}%</span>`:''}</h3>
      <table><thead><tr><th>Subject</th><th>Progress</th><th>%</th><th>Present/Total</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)closePM();});
  document.body.appendChild(modal);
}
function closePM(){
  const m=document.getElementById('profModal');
  if(m)m.remove();
}

/* ---------- Auth rendering ---------- */
let authRole='student', authMode='login';

function renderAuth(){
  const root=document.getElementById('root');
  root.innerHTML=`<div id="authWrap"><div class="authCard">
    <div class="authHead">
      <div class="logo">🏛️</div>
      <h1>Government Engineering College, Arsikere</h1>
      <p>STUDENT MANAGEMENT PORTAL · Hassan District, Karnataka</p>
    </div>
    <div class="authBody">
      <div class="roleTabs">
        <button class="${authRole==='student'?'active':''}" onclick="setRole('student')">Student</button>
        <button class="${authRole==='faculty'?'active':''}" onclick="setRole('faculty')">Faculty</button>
        <button class="${authRole==='admin'?'active':''}" onclick="setRole('admin')">Admin</button>
      </div>
      <div class="authForms" id="authForms">${authBody()}</div>
    </div></div></div>`;
}
function setRole(r){authRole=r;authMode='login';renderAuth();}
function toggleAuthMode(){authMode = authMode==='login'?'register':'login';renderAuth();}

function authBody(){
  if(authRole==='admin'){
    return `<div class="formSlide active">
      <div class="field"><label>Admin Password</label>
        <input type="password" id="adPwd" placeholder="Enter admin password" onkeydown="if(event.key==='Enter')doAdminLogin()"></div>
      <button class="btnGold" onclick="doAdminLogin()">🔐 Admin Login</button>
      <div class="authNote">Admin manages approvals, announcements & event media.</div>
    </div>`;
  }
  if(authRole==='student'){
    if(authMode==='login'){
      return `<div class="formSlide active">
        <div class="field"><label>USN</label><input type="text" id="stUsn" placeholder="e.g. 4GE22CS001" onkeydown="if(event.key==='Enter')document.getElementById('stPwd').focus()"></div>
        <div class="field"><label>Password</label><input type="password" id="stPwd" placeholder="Your password" onkeydown="if(event.key==='Enter')doStudentLogin()"></div>
        <button class="btnGold" onclick="doStudentLogin()">🎓 Student Login</button>
        <div class="switchLnk">New student? <button onclick="toggleAuthMode()">Register here</button></div>
      </div>`;
    }
    return `<div class="formSlide active">
      <div class="field"><label>Full Name *</label><input id="rName" placeholder="Full name"></div>
      <div class="row2">
        <div class="field"><label>USN *</label><input id="rUsn" placeholder="University Seat Number"></div>
        <div class="field"><label>Email *</label><input id="rEmail" type="email" placeholder="email@example.com"></div>
      </div>
      <div class="row3">
        <div class="field"><label>Phone *</label><input id="rPhone" placeholder="Phone"></div>
        <div class="field"><label>DOB *</label><input id="rDob" type="date"></div>
        <div class="field"><label>Section *</label><select id="rSection">${SECTIONS.map(s=>`<option>${s}</option>`).join('')}</select></div>
      </div>
      <div class="row3">
        <div class="field"><label>Branch *</label><select id="rBranch">${BRANCHES.map(b=>`<option>${b}</option>`).join('')}</select></div>
        <div class="field"><label>Semester *</label><select id="rSem">${[1,2,3,4,5,6,7,8].map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div class="field"><label>&nbsp;</label><div style="font-size:11px;color:var(--muted);padding-top:8px">1–8 across 4 years</div></div>
      </div>
      <div class="row2">
        <div class="field"><label>Father's Name *</label><input id="rFather" placeholder="Father's name"></div>
        <div class="field"><label>Mother's Name *</label><input id="rMother" placeholder="Mother's name"></div>
      </div>
      <div class="field"><label>Address *</label><textarea id="rAddress" rows="2" placeholder="Residential address"></textarea></div>
      <div class="row2">
        <div class="field"><label>Password *</label><input id="rPwd" type="password" placeholder="Create password"></div>
        <div class="field"><label>Confirm Password *</label><input id="rPwd2" type="password" placeholder="Repeat password"></div>
      </div>
      <button class="btnGold" onclick="doStudentRegister()">📝 Submit Registration</button>
      <div class="switchLnk">Already registered? <button onclick="toggleAuthMode()">Login here</button></div>
      <div class="authNote">After registration, your account needs admin approval before login.</div>
    </div>`;
  }
  if(authMode==='login'){
    return `<div class="formSlide active">
      <div class="field"><label>Email</label><input id="fcEmail" type="email" placeholder="faculty@example.com" onkeydown="if(event.key==='Enter')document.getElementById('fcPwd').focus()"></div>
      <div class="field"><label>Password</label><input id="fcPwd" type="password" placeholder="Your password" onkeydown="if(event.key==='Enter')doFacultyLogin()"></div>
      <button class="btnGold" onclick="doFacultyLogin()">👨‍🏫 Faculty Login</button>
      <div class="switchLnk">New faculty? <button onclick="toggleAuthMode()">Register here</button></div>
    </div>`;
  }
  return `<div class="formSlide active">
    <div class="field"><label>Full Name *</label><input id="fName" placeholder="Full name"></div>
    <div class="row2">
      <div class="field"><label>Email *</label><input id="fEmail" type="email" placeholder="email@example.com"></div>
      <div class="field"><label>Phone *</label><input id="fPhone" placeholder="Phone"></div>
    </div>
    <div class="row2">
      <div class="field"><label>Designation *</label><select id="fDesg"><option>Assistant Professor</option><option>Associate Professor</option><option>Professor</option><option>Lecturer</option><option>Head of Department</option></select></div>
      <div class="field"><label>Experience (years) *</label><input id="fExp" type="number" min="0" placeholder="Years"></div>
    </div>
    <div class="field"><label>Qualification *</label><input id="fQual" placeholder="e.g. M.Tech, Ph.D"></div>
    <div class="row2">
      <div class="field"><label>Branch *</label><select id="fBranch">${BRANCHES.map(b=>`<option>${b}</option>`).join('')}</select></div>
      <div class="field"><label>Subjects (comma-separated) *</label><input id="fSubjs" placeholder="DBMS, Operating Systems"></div>
    </div>
    <div class="field"><label>Password *</label><input id="fPwd" type="password" placeholder="Create password"></div>
    <button class="btnGold" onclick="doFacultyRegister()">📝 Register as Faculty</button>
    <div class="switchLnk">Already registered? <button onclick="toggleAuthMode()">Login here</button></div>
    <div class="authNote">Faculty can login immediately after registration.</div>
  </div>`;
}

/* ---------- Auth actions ---------- */
async function doAdminLogin(){
  const v=document.getElementById('adPwd').value;
  if(v!==ADMIN_PWD){toast('Wrong admin password','err');return;}
  try{
    await auth.signInWithEmailAndPassword(ADMIN_EMAIL,ADMIN_PWD);
    // onAuthStateChanged handles entering the app
  }catch(e){
    if(e.code==='auth/user-not-found'||e.code==='auth/invalid-credential'||e.code==='auth/invalid-email'||e.code==='auth/operation-not-allowed'){
      try{
        await auth.createUserWithEmailAndPassword(ADMIN_EMAIL,ADMIN_PWD);
        // onAuthStateChanged handles entering the app
      }catch(e2){
        if(e2.code==='auth/email-already-in-use'){
          toast('Admin account exists but login failed. Check password and try again.','err');
        }else{
          toast('Admin setup failed: '+e2.message,'err');
        }
      }
    }else{
      toast('Admin login failed: '+e.message,'err');
    }
  }
}

async function doStudentLogin(){
  const usn=document.getElementById('stUsn').value.trim();
  const pwd=document.getElementById('stPwd').value;
  const st=DB.students.find(s=>s.usn.toLowerCase()===usn.toLowerCase());
  if(!st){toast('Student not found or not approved','err');return;}
  try{
    await auth.signInWithEmailAndPassword(st.email, pwd);
    currentUser={role:'student',obj:st};
    startListeners();
    enterApp();
  }catch(e){
    toast('Login failed: '+e.message,'err');
  }
}

async function doFacultyLogin(){
  const email=document.getElementById('fcEmail').value.trim().toLowerCase();
  const pwd=document.getElementById('fcPwd').value;
  const f=DB.faculty.find(x=>x.email.toLowerCase()===email);
  if(!f){toast('Faculty not found','err');return;}
  try{
    await auth.signInWithEmailAndPassword(f.email, pwd);
    currentUser={role:'faculty',obj:f};
    startListeners();
    enterApp();
  }catch(e){
    toast('Login failed: '+e.message,'err');
  }
}

async function doStudentRegister(){
  const name=val('rName'),usn=val('rUsn'),email=val('rEmail'),phone=val('rPhone'),
    dob=val('rDob'),branch=val('rBranch'),sem=parseInt(val('rSem')),section=val('rSection'),
    father=val('rFather'),mother=val('rMother'),address=val('rAddress'),
    pwd=val('rPwd'),pwd2=val('rPwd2');
  if(!name||!usn||!email||!phone||!dob||!father||!mother||!address||!pwd){toast('Fill all fields','err');return;}
  if(pwd!==pwd2){toast('Passwords do not match','err');return;}
  if(DB.students.find(s=>s.usn.toLowerCase()===usn.toLowerCase()) || DB.pending.find(s=>s.usn.toLowerCase()===usn.toLowerCase())){toast('USN already registered','err');return;}
  try{
    const userCred = await auth.createUserWithEmailAndPassword(email,pwd);
    const uidStr = userCred.user.uid;
    await db.collection("pendingStudents").doc(uidStr).set({
      name,usn,email,phone,dob,branch,sem,section,fatherName:father,motherName:mother,address,status:"pending",joinedOn:Date.now()
    });
    await auth.signOut();
    toast('Registration submitted! Await admin approval.','ok');
    authMode='login';renderAuth();
  }catch(e){
    toast('Registration failed: '+e.message,'err');
  }
}

async function doFacultyRegister(){
  const name=val('fName'),email=val('fEmail'),phone=val('fPhone'),desg=val('fDesg'),
    qual=val('fQual'),exp=parseInt(val('fExp')||"0"),branch=val('fBranch'),
    subjs=val('fSubjs'),pwd=val('fPwd');
  if(!name||!email||!phone||!qual||!subjs||!pwd){toast('Fill all fields','err');return;}
  if(DB.faculty.find(f=>f.email.toLowerCase()===email.toLowerCase())){toast('Email already registered','err');return;}
  try{
    const userCred = await auth.createUserWithEmailAndPassword(email,pwd);
    const uidStr = userCred.user.uid;
    await db.collection("faculty").doc(uidStr).set({
      name,email,phone,designation:desg,qualification:qual,experience:exp,branch,
      subjects:subjs.split(',').map(x=>x.trim()).filter(Boolean),joinedOn:Date.now()
    });
    toast('Faculty registered! You can login now.','ok');
    authMode='login';renderAuth();
  }catch(e){
    toast('Registration failed: '+e.message,'err');
  }
}
function val(id){const el=document.getElementById(id);return el?el.value.trim():'';}

/* ---------- App shell ---------- */
function enterApp(){
  activeTab=null;
  const root=document.getElementById('root');
  root.innerHTML=`<div id="appShell" class="show">
    <div class="topbar"><button class="hamBtn" onclick="toggleSidebar()">☰</button></div>
    <div class="sidebar" id="sidebar">${sideContent()}</div>
    <div class="main"><div id="mainContent"></div></div>
  </div>`;
  if(currentUser.role==='admin')navTo('a_overview');
  else if(currentUser.role==='faculty')navTo('f_home');
  else navTo('s_home');
}
function sideContent(){
  let nav='';
  if(currentUser.role==='admin'){
    const pendCount=DB.pending.length;
    nav=`<button data-tab="a_overview" onclick="navTo('a_overview')"><span class="ico">📊</span> Overview</button>
      <button data-tab="a_pending" onclick="navTo('a_pending')"><span class="ico">⏳</span> Pending (${pendCount})</button>
      <button data-tab="a_students" onclick="navTo('a_students')"><span class="ico">🎓</span> All Students</button>
      <button data-tab="a_faculty" onclick="navTo('a_faculty')"><span class="ico">👨‍🏫</span> Faculty Directory</button>
      <button data-tab="a_announce" onclick="navTo('a_announce')"><span class="ico">📢</span> Announcements</button>
      <button data-tab="a_timetable" onclick="navTo('a_timetable')"><span class="ico">📅</span> Timetable</button>
      <button data-tab="a_calendar" onclick="navTo('a_calendar')"><span class="ico">🗓️</span> Academic Calendar</button>`;
  } else if(currentUser.role==='faculty'){
    nav=`<button data-tab="f_home" onclick="navTo('f_home')"><span class="ico">🏠</span> Home</button>
      <button data-tab="f_students" onclick="navTo('f_students')"><span class="ico">🎓</span> My Students</button>
      <button data-tab="f_att" onclick="navTo('f_att')"><span class="ico">✓</span> Mark Attendance</button>
      <button data-tab="f_marks" onclick="navTo('f_marks')"><span class="ico">🎯</span> Marks</button>
      <button data-tab="f_materials" onclick="navTo('f_materials')"><span class="ico">📚</span> Study Materials</button>
      <button data-tab="f_assign" onclick="navTo('f_assign')"><span class="ico">📝</span> Assignments</button>
      <button data-tab="f_announce" onclick="navTo('f_announce')"><span class="ico">📢</span> Notices</button>
      <button data-tab="f_profile" onclick="navTo('f_profile')"><span class="ico">👤</span> My Profile</button>`;
  } else {
    nav=`<button data-tab="s_home" onclick="navTo('s_home')"><span class="ico">🏠</span> Home</button>
      <button data-tab="s_att" onclick="navTo('s_att')"><span class="ico">✓</span> My Attendance</button>
      <button data-tab="s_subs" onclick="navTo('s_subs')"><span class="ico">📘</span> Subjects</button>
      <button data-tab="s_marks" onclick="navTo('s_marks')"><span class="ico">🎯</span> My Marks</button>
      <button data-tab="s_timetable" onclick="navTo('s_timetable')"><span class="ico">📅</span> Timetable</button>
      <button data-tab="s_materials" onclick="navTo('s_materials')"><span class="ico">📚</span> Study Materials</button>
      <button data-tab="s_calendar" onclick="navTo('s_calendar')"><span class="ico">🗓️</span> Calendar</button>
      <button data-tab="s_assign" onclick="navTo('s_assign')"><span class="ico">📝</span> Assignments</button>
      <button data-tab="s_ann" onclick="navTo('s_ann')"><span class="ico">📢</span> Notices</button>
      <button data-tab="s_fac" onclick="navTo('s_fac')"><span class="ico">👨‍🏫</span> Faculty</button>
      <button data-tab="s_chat" onclick="navTo('s_chat')"><span class="ico">💬</span> Messages</button>
      <button data-tab="s_profile" onclick="navTo('s_profile')"><span class="ico">👤</span> My Profile</button>`;
  }
  let uinfo='';
  if(currentUser.role==='admin'){
    uinfo=`<div style="display:flex;align-items:center;gap:10px">
      ${av('A',34,'#c9922a')}<div class="uinfo"><div class="uname">Administrator</div><div class="urole">Admin</div></div></div>`;
  } else {
    const o=currentUser.obj;
    uinfo=`<div style="display:flex;align-items:center;gap:10px">
      ${av(initials(o.name),34,BRANCH_COLOR[o.branch]||pickColor(o.name))}
      <div class="uinfo"><div class="uname">${esc(o.name)}</div><div class="urole">${currentUser.role}</div></div></div>`;
  }
  return `<div class="sideHead"><div class="logo">🏛️</div><h2>GEC Arsikere</h2><p>STUDENT PORTAL</p></div>
    <div class="sideUser">${uinfo}</div>
    <div class="navList" id="navList">${nav}</div>
    <div class="sideFoot"><button class="btnOut" onclick="signOut()">⏻ Sign Out</button></div>`;
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');}
function closeSidebar(){const s=document.getElementById('sidebar');if(s)s.classList.remove('open');}

function navTo(tab){
  activeTab=tab;
  const sb=document.getElementById('sidebar');
  if(sb) sb.innerHTML=sideContent();
  document.querySelectorAll('#navList button').forEach(b=>{
    b.classList.remove('active','activeTeal');
    if(b.getAttribute('data-tab')===tab){
      b.classList.add(currentUser.role==='faculty'?'activeTeal':'active');
    }
  });
  const mc=document.getElementById('mainContent');
  if(currentUser.role==='admin')renderAdmin(tab,mc);
  else if(currentUser.role==='faculty')renderFaculty(tab,mc);
  else renderStudent(tab,mc);
  closeSidebar();
}
async function signOut(){
  try{await auth.signOut();}catch(e){}
  unsubscribers.forEach(u=>{try{u()}catch(e){}});
  unsubscribers=[];
  currentUser=null;activeTab=null;
  renderAuth();
}

/* ---------- ADMIN PANEL ---------- */
function renderAdmin(tab,mc){
  if(tab==='a_overview')renderAOverview(mc);
  else if(tab==='a_pending')renderAPending(mc);
  else if(tab==='a_students')renderAStudents(mc);
  else if(tab==='a_faculty')renderAFaculty(mc);
  else if(tab==='a_announce')renderAAnnounce(mc);
  else if(tab==='a_timetable')renderATimetable(mc);
  else if(tab==='a_calendar')renderACalendar(mc);
}
function renderAOverview(mc){
  const bc={CSE:0,ISE:0,EC:0,AIML:0};
  DB.students.forEach(s=>{if(bc[s.branch]!=null)bc[s.branch]++;});
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Admin Overview</h1>
    <p class="sub">Government Engineering College, Arsikere — dashboard snapshot</p>
    <div class="grid4" style="margin-bottom:16px">
      <div class="statCard"><div class="ic">🎓</div><div class="num">${DB.students.length}</div><div class="lbl">Total Students</div></div>
      <div class="statCard"><div class="ic">⏳</div><div class="num">${DB.pending.length}</div><div class="lbl">Pending Approvals</div></div>
      <div class="statCard"><div class="ic">👨‍🏫</div><div class="num">${DB.faculty.length}</div><div class="lbl">Faculty Members</div></div>
      <div class="statCard"><div class="ic">📢</div><div class="num">${DB.announcements.length}</div><div class="lbl">Announcements</div></div>
    </div>
    <h3 style="margin-bottom:10px;color:var(--navy)">Branch-wise Students</h3>
    <div class="grid4" style="margin-bottom:20px">
      ${BRANCHES.map(b=>`<div class="branchCard" style="background:linear-gradient(135deg,${BRANCH_COLOR[b]},${BRANCH_COLOR[b]}aa)">
        <div class="bcic">🎓</div><h4>${b}</h4><div class="bcnum">${bc[b]}</div></div>`).join('')}
    </div>
    <h3 style="margin-bottom:10px;color:var(--navy)">Upcoming Calendar Events</h3>
    <div class="card">${upcomingCalendar()}</div>
  </div>`;
}
function renderAPending(mc){
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Pending Approvals</h1>
    <p class="sub">${DB.pending.length} student(s) awaiting approval</p>
    ${DB.pending.length===0?`<div class="empty"><div class="em">✓</div><p>No pending registrations.</p></div>`:
    DB.pending.map(s=>`<div class="card" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap">
        ${av(initials(s.name),48,BRANCH_COLOR[s.branch]||pickColor(s.name))}
        <div style="flex:1;min-width:200px">
          <div style="font-weight:700;font-size:15px;color:var(--navy)">${esc(s.name)}</div>
          <div style="font-size:12.5px;color:var(--muted)">${esc(s.usn)} · ${esc(s.email)} · ${esc(s.phone)}</div>
          <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap">${branchBadge(s.branch)}${badge("Sem "+s.sem,"b-info")}${badge("Sec "+s.section,"b-navy")}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px">Father: ${esc(s.fatherName)} · Mother: ${esc(s.motherName)}</div>
          <div style="font-size:12px;color:var(--muted)">Address: ${esc(s.address)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn btn-success btn-sm" onclick="approveStu('${s.id}')">✓ Approve</button>
          <button class="btn btn-danger btn-sm" onclick="rejectStu('${s.id}')">✗ Reject</button>
        </div>
      </div></div>`).join('')}
  </div>`;
}
async function approveStu(id){
  const s=DB.pending.find(x=>x.id===id);
  if(!s)return;
  try{
    await db.collection("students").doc(id).set({...s,status:"approved"});
    await db.collection("pendingStudents").doc(id).delete();
    toast(s.name+' approved','ok');
  }catch(e){
    toast('Approval failed: '+e.message,'err');
  }
}
async function rejectStu(id){
  const s=DB.pending.find(x=>x.id===id);
  if(!s)return;
  try{
    await db.collection("pendingStudents").doc(id).delete();
    toast(s.name+' rejected','err');
  }catch(e){
    toast('Rejection failed: '+e.message,'err');
  }
}
let _aSearch='',_aBranch='All',_aSem='All';
function renderAStudents(mc){
  let list=DB.students.slice();
  if(_aSearch){const q=_aSearch.toLowerCase();list=list.filter(s=>s.name.toLowerCase().includes(q)||s.usn.toLowerCase().includes(q)||s.email.toLowerCase().includes(q));}
  if(_aBranch!=='All')list=list.filter(s=>s.branch===_aBranch);
  if(_aSem!=='All')list=list.filter(s=>String(s.sem)===_aSem);
  const grouped={};BRANCHES.forEach(b=>grouped[b]=[]);
  list.forEach(s=>{if(grouped[s.branch])grouped[s.branch].push(s);});
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">All Students</h1>
    <p class="sub">${list.length} student(s)</p>
    <div class="card" style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap">
      <input class="input" style="flex:1;min-width:180px" placeholder="Search name, USN, email..." value="${esc(_aSearch)}" oninput="_aSearch=this.value;renderAStudents(document.getElementById('mainContent'))">
      <select class="sel" style="width:130px" onchange="_aBranch=this.value;renderAStudents(document.getElementById('mainContent'))"><option ${_aBranch==='All'?'selected':''}>All</option>${BRANCHES.map(b=>`<option ${_aBranch===b?'selected':''}>${b}</option>`).join('')}</select>
      <select class="sel" style="width:110px" onchange="_aSem=this.value;renderAStudents(document.getElementById('mainContent'))"><option ${_aSem==='All'?'selected':''}>All</option>${[1,2,3,4,5,6,7,8].map(s=>`<option ${_aSem===String(s)?'selected':''}>${s}</option>`).join('')}</select>
    </div>
    ${BRANCHES.map(b=>grouped[b].length===0?'':`<h3 style="margin:14px 0 8px;color:var(--navy)">${b} <span class="badge b-navy" style="margin-left:6px">${grouped[b].length}</span></h3>
      <div class="grid3">${grouped[b].map(s=>`<div class="sCard">
        ${av(initials(s.name),40,BRANCH_COLOR[b])}
        <div class="scInfo"><div class="scName">${esc(s.name)}</div><div class="scMeta">${esc(s.usn)} · Sem ${s.sem} · Sec ${s.section}</div></div>
        <div class="scActs">
          <button class="btn btn-ghost btn-sm" onclick='openPMStr(${JSON.stringify(JSON.stringify(s))})'>👁 Profile</button>
          <button class="btn btn-danger btn-sm" onclick="delStu('${s.id}')">🗑</button>
        </div></div>`).join('')}</div>`).join('')}
  </div>`;
}
function openPMStr(serialized){openPM(JSON.parse(serialized));}
async function delStu(id){
  if(!confirm('Delete this student permanently?'))return;
  try{
    await db.collection("students").doc(id).delete();
    const attSnap = await db.collection("attendance").where("studentId","==",id).get();
    const batch = db.batch();
    attSnap.docs.forEach(d=>batch.delete(d.ref));
    await batch.commit();
    toast('Student deleted','ok');
  }catch(e){
    toast('Delete failed: '+e.message,'err');
  }
}
function renderAFaculty(mc){
  const grouped={};BRANCHES.forEach(b=>grouped[b]=[]);
  DB.faculty.forEach(f=>{if(grouped[f.branch])grouped[f.branch].push(f);});
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Faculty Directory</h1>
    <p class="sub">${DB.faculty.length} faculty member(s)</p>
    ${DB.faculty.length===0?`<div class="empty"><div class="em">👨‍🏫</div><p>No faculty registered yet.</p></div>`:
    BRANCHES.map(b=>grouped[b].length===0?'':`<h3 style="margin:14px 0 8px;color:var(--navy)">${b}</h3>
      <div class="grid3">${grouped[b].map(f=>`<div class="card">
        <div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
          ${av(initials(f.name),44,BRANCH_COLOR[b])}
          <div><div style="font-weight:700;color:var(--navy)">${esc(f.name)}</div>
          <div style="font-size:12px;color:var(--muted)">${esc(f.designation)}</div></div>
        </div>
        <div style="font-size:12.5px;color:#3a4a5d;margin-bottom:6px">${esc(f.qualification)} · ${f.experience} yrs</div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px">✉ ${esc(f.email)}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${(f.subjects||[]).map(s=>badge(s,"b-teal")).join('')||'<span style="font-size:12px;color:var(--muted)">No subjects assigned</span>'}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-teal btn-sm" onclick="editFacSubjects('${f.id}')">✏️ Edit Subjects</button>
          <button class="btn btn-danger btn-sm" onclick="delFac('${f.id}')">🗑</button>
        </div>
      </div>`).join('')}</div>`).join('')}
  </div>`;
}
async function delFac(id){
  if(!confirm('Delete this faculty?'))return;
  try{
    await db.collection("faculty").doc(id).delete();
    toast('Faculty deleted','ok');
  }catch(e){
    toast('Delete failed: '+e.message,'err');
  }
}

/* ---------- Admin: Edit Faculty Subjects Modal ---------- */
let _editFacId=null;
function editFacSubjects(facId){
  const f=DB.faculty.find(x=>x.id===facId);
  if(!f)return;
  _editFacId=facId;
  const modal=document.createElement('div');
  modal.className='overlay';modal.id='editFacModal';
  modal.innerHTML=`<div class="modal" style="max-width:480px">
    <div class="modalHead"><h3>Edit Subjects — ${esc(f.name)}</h3><button class="x" onclick="closeEditFac()">✕</button></div>
    <div class="modalBody">
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px">Add or remove teaching subjects. Changes save to Firestore and sync instantly.</div>
      <div id="facSubjList" style="margin-bottom:12px"></div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <input id="facNewSubj" class="input" style="flex:1" placeholder="Type a subject and press Add" onkeydown="if(event.key==='Enter')addFacSubj()">
        <button class="btn btn-teal btn-sm" onclick="addFacSubj()">+ Add</button>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Or pick from syllabus:</div>
      <div id="facSyllabusPicks" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px"></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-teal" onclick="saveFacSubjects()">💾 Save Changes</button>
        <button class="btn btn-ghost" onclick="closeEditFac()">Cancel</button>
      </div>
    </div></div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)closeEditFac();});
  document.body.appendChild(modal);
  renderFacSubjEditor(f);
}
function renderFacSubjEditor(f){
  const list=document.getElementById('facSubjList');
  const subs=f.subjects||[];
  if(subs.length===0){
    list.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0">No subjects yet. Add some below.</div>';
  } else {
    list.innerHTML=subs.map((s,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
      <span class="badge b-teal">${esc(s)}</span>
      <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="removeFacSubj(${i})">✕ Remove</button>
    </div>`).join('');
  }
  // syllabus picks — show subjects from this branch not already added
  const branchSubs=[];
  for(let sem=1;sem<=8;sem++){subjectsFor(f.branch,sem).forEach(s=>{if(!branchSubs.includes(s))branchSubs.push(s);});}
  const available=branchSubs.filter(s=>!subs.includes(s));
  const picks=document.getElementById('facSyllabusPicks');
  _facPicks=available;
  picks.innerHTML=available.length===0?'<span style="font-size:12px;color:var(--muted)">All syllabus subjects already added.</span>':
    available.map((s,i)=>`<button class="btn btn-ghost btn-sm" onclick="addFacSubjByPick(${i})">${esc(s)}</button>`).join('');
}
let _facPicks=[];
function addFacSubjByPick(i){
  if(_facPicks[i])addFacSubjByName(_facPicks[i]);
}
function addFacSubj(){
  const inp=document.getElementById('facNewSubj');
  const v=inp.value.trim();if(!v)return;
  addFacSubjByName(v);
  inp.value='';
}
function addFacSubjByName(name){
  if(!_facSubjDraft.includes(name))_facSubjDraft.push(name);
  const f=DB.faculty.find(x=>x.id===_editFacId);
  if(f)f.subjects=_facSubjDraft.slice();
  renderFacSubjEditor(f);
}
function removeFacSubj(i){
  _facSubjDraft.splice(i,1);
  const f=DB.faculty.find(x=>x.id===_editFacId);
  if(f)f.subjects=_facSubjDraft.slice();
  renderFacSubjEditor(f);
}
async function saveFacSubjects(){
  if(!_editFacId)return;
  try{
    await db.collection("faculty").doc(_editFacId).update({subjects:_facSubjDraft});
    toast('Subjects updated — syncing to all devices','ok');
    closeEditFac();
  }catch(e){
    toast('Save failed: '+e.message,'err');
  }
}
function closeEditFac(){
  const m=document.getElementById('editFacModal');
  if(m)m.remove();
  _editFacId=null;_facSubjDraft=[];
}

function renderAAnnounce(mc){
  const sorted=DB.announcements.slice().sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.date-a.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Announcements</h1>
    <p class="sub">Post notices visible to students & faculty</p>
    <div class="split">
      <div>
        <h3 style="margin-bottom:10px;color:var(--navy)">All Announcements (${DB.announcements.length})</h3>
        ${sorted.length===0?`<div class="empty"><div class="em">📢</div><p>No announcements yet.</p></div>`:
        sorted.map(a=>`<div class="noticeCard ${a.pinned?'pinned':''}">
          <div class="nt">${esc(a.title)} ${a.pinned?'📌':''}</div>
          <div class="nb">${esc(a.body)}</div>
          <div class="nmeta">${badge(a.type,'b-'+(a.type==='exam'?'warn':a.type==='event'?'info':'gold'))} ${a.branch==='All'?badge('All Branches','b-navy'):branchBadge(a.branch)} · by ${esc(a.author)} · ${fmtDate(a.date)}
          <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="delAnn('${a.id}')">🗑</button></div>
        </div>`).join('')}
      </div>
      <div class="card stickyR">
        <h3>Post Announcement</h3>
        <div class="field"><label>Title *</label><input id="anTitle" class="input" placeholder="Announcement title"></div>
        <div class="field"><label>Body</label><textarea id="anBody" class="txt" rows="4" placeholder="Announcement details"></textarea></div>
        <div class="row2">
          <div class="field"><label>Type</label><select id="anType" class="sel"><option value="general">General</option><option value="exam">Exam</option><option value="event">Event</option></select></div>
          <div class="field"><label>Target Branch</label><select id="anBranch" class="sel"><option>All</option>${BRANCHES.map(b=>`<option>${b}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label><input type="checkbox" id="anPin"> Pin to top</label></div>
        <button class="btn btn-gold" style="width:100%" onclick="postAnn()">📢 Post Announcement</button>
      </div>
    </div>
  </div>`;
}
async function postAnn(){
  const title=val('anTitle');if(!title){toast('Title required','err');return;}
  try{
    await db.collection("announcements").add({
      title,body:val('anBody'),type:val('anType'),branch:val('anBranch'),pinned:document.getElementById('anPin').checked,author:"Admin",date:Date.now()
    });
    toast('Announcement posted','ok');
  }catch(e){
    toast('Post failed: '+e.message,'err');
  }
}
async function delAnn(id){
  try{
    await db.collection("announcements").doc(id).delete();
    toast('Announcement deleted','ok');
  }catch(e){
    toast('Delete failed: '+e.message,'err');
  }
}

/* ---------- ADMIN: Timetable Management ---------- */
let _ttBranch=null,_ttSem=null,_ttDay='Monday';
function renderATimetable(mc){
  if(!_ttBranch)_ttBranch=BRANCHES[0];
  if(!_ttSem)_ttSem=1;
  const periods=timetableByDay(_ttBranch,parseInt(_ttSem),_ttDay);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Timetable Management</h1>
    <p class="sub">Create class schedules for each branch, semester & day</p>
    <div class="split">
      <div class="card">
        <div class="row3" style="margin-bottom:10px">
          <div class="field"><label>Branch</label><select class="sel" onchange="_ttBranch=this.value;renderATimetable(document.getElementById('mainContent'))">${BRANCHES.map(b=>`<option ${_ttBranch===b?'selected':''}>${b}</option>`).join('')}</select></div>
          <div class="field"><label>Semester</label><select class="sel" onchange="_ttSem=this.value;renderATimetable(document.getElementById('mainContent'))">${[1,2,3,4,5,6,7,8].map(s=>`<option ${_ttSem==s?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Day</label><select class="sel" onchange="_ttDay=this.value;renderATimetable(document.getElementById('mainContent'))">${DAYS.map(d=>`<option ${_ttDay===d?'selected':''}>${d}</option>`).join('')}</select></div>
        </div>
        <h3 style="margin-bottom:10px;color:var(--navy)">${_ttDay} — ${_ttBranch} Sem ${_ttSem} (${periods.length} periods)</h3>
        ${periods.length===0?`<div class="empty"><div class="em">📅</div><p>No periods added for this day yet.</p></div>`:
        periods.map(p=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
          <span class="badge b-navy">P${p.period}</span>
          <div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:var(--navy)">${esc(p.subject)}</div>
          <div style="font-size:11px;color:var(--muted)">${esc(p.startTime||'')} - ${esc(p.endTime||'')} · ${esc(p.facultyName||'TBD')}</div></div>
          <button class="btn btn-danger btn-sm" onclick="delTT('${p.id}')">🗑</button></div>`).join('')}
      </div>
      <div class="card stickyR">
        <h3>Add Period</h3>
        <div class="field"><label>Period Number</label><input id="ttPeriod" type="number" min="1" max="8" class="input" value="${periods.length+1}"></div>
        <div class="field"><label>Subject</label><input id="ttSubject" class="input" placeholder="Subject name"></div>
        <div class="row2">
          <div class="field"><label>Start Time</label><input id="ttStart" type="time" class="input"></div>
          <div class="field"><label>End Time</label><input id="ttEnd" type="time" class="input"></div>
        </div>
        <div class="field"><label>Faculty Name</label><input id="ttFac" class="input" placeholder="Faculty name"></div>
        <button class="btn btn-teal" style="width:100%" onclick="addTT()">➕ Add Period</button>
      </div>
    </div>
  </div>`;
}
async function addTT(){
  const period=parseInt(val('ttPeriod'));
  const subject=val('ttSubject');if(!subject){toast('Subject required','err');return;}
  try{
    await db.collection("timetable").add({
      branch:_ttBranch,sem:parseInt(_ttSem),day:_ttDay,period,
      subject,startTime:val('ttStart'),endTime:val('ttEnd'),facultyName:val('ttFac')
    });
    toast('Period added','ok');
  }catch(e){toast('Add failed: '+e.message,'err');}
}
async function delTT(id){
  try{await db.collection("timetable").doc(id).delete();toast('Period deleted','ok');}
  catch(e){toast('Delete failed: '+e.message,'err');}
}

/* ---------- ADMIN: Academic Calendar ---------- */
function renderACalendar(mc){
  const list=DB.calendar.slice().sort((a,b)=>a.date-b.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Academic Calendar</h1>
    <p class="sub">Add holidays, exams & events visible to all students and faculty</p>
    <div class="split">
      <div>
        <h3 style="margin-bottom:10px;color:var(--navy)">Calendar Events (${list.length})</h3>
        ${list.length===0?`<div class="empty"><div class="em">🗓️</div><p>No calendar events yet.</p></div>`:
        list.map(c=>`<div class="card" style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">${c.type==='holiday'?'🏖️':c.type==='exam'?'📝':'🎉'}</span>
            <div style="flex:1"><div style="font-weight:700;color:var(--navy)">${esc(c.title)}</div>
            <div style="font-size:12px;color:var(--muted)">${fmtDate(c.date)}${c.description?' · '+esc(c.description):''}</div></div>
            <button class="btn btn-danger btn-sm" onclick="delCal('${c.id}')">🗑</button>
          </div>
          <div style="margin-top:6px">${badge(c.type,'b-'+(c.type==='holiday'?'info':c.type==='exam'?'warn':'gold'))}</div>
        </div>`).join('')}
      </div>
      <div class="card stickyR">
        <h3>Add Event</h3>
        <div class="field"><label>Title *</label><input id="calTitle" class="input" placeholder="Event title"></div>
        <div class="field"><label>Date *</label><input id="calDate" type="date" class="input"></div>
        <div class="field"><label>Type</label><select id="calType" class="sel"><option value="holiday">🏖️ Holiday</option><option value="exam">📝 Exam</option><option value="event">🎉 Event</option></select></div>
        <div class="field"><label>Description</label><textarea id="calDesc" class="txt" rows="2" placeholder="Optional details"></textarea></div>
        <button class="btn btn-teal" style="width:100%" onclick="addCal()">➕ Add to Calendar</button>
      </div>
    </div>
  </div>`;
}
async function addCal(){
  const title=val('calTitle');if(!title){toast('Title required','err');return;}
  const dateStr=val('calDate');if(!dateStr){toast('Date required','err');return;}
  try{
    await db.collection("calendar").add({
      title,type:document.getElementById('calType').value,
      date:new Date(dateStr).getTime(),description:val('calDesc')
    });
    toast('Calendar event added','ok');
  }catch(e){toast('Add failed: '+e.message,'err');}
}
async function delCal(id){
  try{await db.collection("calendar").doc(id).delete();toast('Event deleted','ok');}
  catch(e){toast('Delete failed: '+e.message,'err');}
}
function upcomingCalendar(){
  const now=Date.now();
  const upcoming=DB.calendar.filter(c=>c.date>=now).sort((a,b)=>a.date-b.date).slice(0,4);
  if(upcoming.length===0)return '<div class="empty" style="padding:14px"><p>No upcoming events.</p></div>';
  return upcoming.map(c=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:20px">${c.type==='holiday'?'🏖️':c.type==='exam'?'📝':'🎉'}</span>
    <div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--navy)">${esc(c.title)}</div>
    <div style="font-size:11px;color:var(--muted)">${fmtDate(c.date)}</div></div>
    ${badge(c.type,'b-'+(c.type==='holiday'?'info':c.type==='exam'?'warn':'gold'))}
  </div>`).join('');
}

/* ---------- FACULTY DASHBOARD ---------- */
function renderFaculty(tab,mc){
  if(tab==='f_home')renderFHome(mc);
  else if(tab==='f_students')renderFStudents(mc);
  else if(tab==='f_att')renderFAtt(mc);
  else if(tab==='f_assign')renderFAssign(mc);
  else if(tab==='f_announce')renderFAnnounce(mc);
  else if(tab==='f_marks')renderFMarks(mc);
  else if(tab==='f_materials')renderFMaterials(mc);
  else if(tab==='f_profile')renderFProfile(mc);
}
function renderFHome(mc){
  const f=currentUser.obj;
  const myStu=DB.students.filter(s=>s.branch===f.branch);
  const myAssign=DB.assignments.filter(a=>a.branch===f.branch && a.postedBy===f.id);
  mc.innerHTML=`<div class="page">
    <div class="heroBanner"><div><h2>Welcome, ${esc(f.name)}</h2><p>${esc(f.designation)} · ${f.branch} Branch</p></div>
      ${av(initials(f.name),54,BRANCH_COLOR[f.branch])}</div>
    <div class="grid3" style="margin-bottom:16px">
      <div class="statCard"><div class="ic">🎓</div><div class="num">${myStu.length}</div><div class="lbl">My Students</div></div>
      <div class="statCard"><div class="ic">📝</div><div class="num">${myAssign.length}</div><div class="lbl">Assignments Posted</div></div>
      <div class="statCard"><div class="ic">📘</div><div class="num">${(f.subjects||[]).length}</div><div class="lbl">My Subjects</div></div>
    </div>
    <h3 style="margin-bottom:10px;color:var(--navy)">My Teaching Subjects</h3>
    <div class="card">${(f.subjects||[]).length===0?'<div class="empty" style="padding:14px"><p>No subjects added yet. Edit your profile to add subjects.</p></div>':(f.subjects||[]).map(s=>`<span class="badge b-teal" style="margin:3px">${esc(s)}</span>`).join('')}</div>
  </div>`;
}
function renderFStudents(mc){
  const f=currentUser.obj;
  const list=DB.students.filter(s=>s.branch===f.branch);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Students</h1>
    <p class="sub">${list.length} student(s) in ${f.branch}</p>
    ${list.length===0?`<div class="empty"><div class="em">🎓</div><p>No students in your branch yet.</p></div>`:
    `<div class="grid3">${list.map(s=>`<div class="sCard">
      ${av(initials(s.name),40,BRANCH_COLOR[f.branch])}
      <div class="scInfo"><div class="scName">${esc(s.name)}</div><div class="scMeta">${esc(s.usn)} · Sem ${s.sem} · Sec ${s.section}</div></div>
      <div class="scActs"><button class="btn btn-ghost btn-sm" onclick='openPMStr(${JSON.stringify(JSON.stringify(s))})'>👁 Profile & Attendance</button></div>
    </div>`).join('')}</div>`}
  </div>`;
}

let _attBranch=null,_attSem=null,_attSubject=null,_attDate=null,_attState={};
function renderFAtt(mc){
  const f=currentUser.obj;
  if(!_attBranch)_attBranch=f.branch;
  if(!_attSem)_attSem=1;
  if(!_attDate)_attDate=today();
  const subs=subjectsFor(_attBranch,_attSem);
  const isMySub = sub => (f.subjects||[]).some(fs => sub.toLowerCase().includes(fs.toLowerCase()) || fs.toLowerCase().includes(sub.toLowerCase()));
  const students=DB.students.filter(s=>s.branch===_attBranch && s.sem===parseInt(_attSem));
  if(!_attState.students){
    _attState={students:{}};
    students.forEach(s=>_attState.students[s.id]="present");
  }
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Mark Attendance</h1>
    <p class="sub">Select branch, semester & subject</p>
    <div class="split">
      <div class="card">
        <div class="row3" style="margin-bottom:10px">
          <div class="field"><label>Branch</label><select class="sel" onchange="_attBranch=this.value;_attState={};renderFAtt(document.getElementById('mainContent'))">${BRANCHES.map(b=>`<option ${_attBranch===b?'selected':''}>${b}</option>`).join('')}</select></div>
          <div class="field"><label>Semester</label><select class="sel" onchange="_attSem=this.value;_attSubject=null;_attState={};renderFAtt(document.getElementById('mainContent'))">${[1,2,3,4,5,6,7,8].map(s=>`<option ${_attSem==s?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Date</label><input type="date" class="input" value="${_attDate}" onchange="_attDate=this.value"></div>
        </div>
        <div class="field"><label>Subject</label><select class="sel" onchange="_attSubject=this.value;renderFAtt(document.getElementById('mainContent'))">
          <option value="">Select subject...</option>
          ${subs.map(s=>{const mine=isMySub(s);return `<option value="${esc(s)}" ${_attSubject===s?'selected':''}>${mine?'★ ':''}${esc(s)}${mine?' (My Subject)':''}</option>`;}).join('')}
        </select></div>
        <div id="attHint" style="font-size:12.5px;margin:6px 0 12px">${_attSubject?(isMySub(_attSubject)?'<span style="color:var(--success)">✓ Your subject</span>':'<span style="color:var(--warn)">⚠ Not in your list</span>'):'<span style="color:var(--muted)">Pick a subject to mark attendance</span>'}</div>
        ${_attSubject?`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <span class="badge b-navy">${students.length} students</span>
          <button class="btn btn-ghost btn-sm" onclick="attAll('present')">✓ All Present</button>
          <button class="btn btn-ghost btn-sm" onclick="attAll('absent')">✗ All Absent</button>
          <button class="btn btn-ghost btn-sm" onclick="attAll('clear')">↺ Clear</button>
        </div>
        <div id="attRows">${attRows(students,_attBranch,_attSem)}</div>
        <button class="btn btn-teal" style="margin-top:12px;width:100%" onclick="saveAtt()">💾 Save Attendance</button>`:''}
      </div>
      <div class="card stickyR">
        <h3>Class Summary</h3>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${_attBranch} · Sem ${_attSem}</div>
        ${students.length===0?`<div class="empty"><div class="em">📋</div><p>No students in this class.</p></div>`:
        students.map(s=>{const ov=overallAtt(s.id,_attBranch,_attSem);const col=ov==null?'var(--muted)':ov>=75?'var(--success)':'var(--danger)';
          return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick='openPMStr(${JSON.stringify(JSON.stringify(s))})'>
            ${av(initials(s.name),30,BRANCH_COLOR[_attBranch])}
            <div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:600;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.name)}</div>
            <div style="font-size:11px;color:var(--muted)">${esc(s.usn)}</div></div>
            <b style="color:${col};font-size:13px">${ov==null?'—':ov+'%'}</b></div>`;}).join('')}
      </div>
    </div>
  </div>`;
}
function attRows(students,branch,sem){
  return students.map(s=>{
    const st=_attState.students[s.id]||'clear';
    const ov=overallAtt(s.id,branch,sem);
    const cls=st==='present'?'present':st==='absent'?'absent':'';
    return `<div class="attRow ${cls}">
      ${av(initials(s.name),32,BRANCH_COLOR[branch])}
      <div class="attInfo"><div class="attName">${esc(s.name)}</div><div class="attMeta">${esc(s.usn)} · ${ov==null?'no data':ov+'%'}</div></div>
      <button class="pabtn p ${st==='present'?'sel':''}" onclick="attSet('${s.id}','present')">Present</button>
      <button class="pabtn a ${st==='absent'?'sel':''}" onclick="attSet('${s.id}','absent')">Absent</button>
    </div>`;
  }).join('');
}
function attSet(id,v){
  _attState.students[id]=v;
  document.getElementById('attRows').innerHTML=attRows(DB.students.filter(s=>s.branch===_attBranch && s.sem===parseInt(_attSem)),_attBranch,_attSem);
}
function attAll(v){
  const students=DB.students.filter(s=>s.branch===_attBranch && s.sem===parseInt(_attSem));
  if(v==='clear'){_attState.students={};}
  else students.forEach(s=>_attState.students[s.id]=v);
  document.getElementById('attRows').innerHTML=attRows(students,_attBranch,_attSem);
}
async function saveAtt(){
  if(!_attSubject){toast('Select a subject','err');return;}
  const students=DB.students.filter(s=>s.branch===_attBranch && s.sem===parseInt(_attSem));
  let saved=0;
  const batch=db.batch();
  students.forEach(s=>{
    const v=_attState.students[s.id];
    if(v==='present'||v==='absent'){
      const docId = s.id+"_"+_attSubject+"_"+_attDate;
      batch.set(db.collection("attendance").doc(docId),{
        studentId:s.id,subject:_attSubject,date:_attDate,status:v,branch:_attBranch,sem:parseInt(_attSem)
      });
      saved++;
    }
  });
  try{
    await batch.commit();
    toast('Attendance saved for '+saved+' students','ok');
  }catch(e){
    toast('Save failed: '+e.message,'err');
  }
}

function renderFAssign(mc){
  const f=currentUser.obj;
  const list=DB.assignments.filter(a=>a.branch===f.branch);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Assignments</h1>
    <p class="sub">Post assignments for ${f.branch} students</p>
    <div class="split">
      <div>
        <h3 style="margin-bottom:10px;color:var(--navy)">${f.branch} Assignments (${list.length})</h3>
        ${list.length===0?`<div class="empty"><div class="em">📝</div><p>No assignments posted yet.</p></div>`:
        list.slice().reverse().map(a=>`<div class="card" style="margin-bottom:10px">
          <div style="font-weight:700;color:var(--navy)">📝 ${esc(a.title)}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin:6px 0">${badge(a.subject,'b-teal')}${branchBadge(a.branch)}${badge("Sem "+a.sem,"b-info")} ${badge("Due "+a.dueDate,'b-warn')}</div>
          <div style="font-size:12.5px;color:#3a4a5d">${esc(a.description)}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:6px">Posted ${fmtDate(a.postedOn)}</div>
        </div>`).join('')}
      </div>
      <div class="card stickyR">
        <h3>Post Assignment</h3>
        <div class="field"><label>Title *</label><input id="asTitle" class="input" placeholder="Assignment title"></div>
        <div class="row2">
          <div class="field"><label>Semester *</label><select id="asSem" class="sel" onchange="loadAsSubs()">${[1,2,3,4,5,6,7,8].map(s=>`<option>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Subject</label><select id="asSubj" class="sel"></select></div>
        </div>
        <div class="field"><label>Due Date *</label><input id="asDue" type="date" class="input"></div>
        <div class="field"><label>Description</label><textarea id="asDesc" class="txt" rows="3" placeholder="Assignment details"></textarea></div>
        <button class="btn btn-teal" style="width:100%" onclick="postAssign()">📝 Post Assignment</button>
      </div>
    </div>
  </div>`;
  loadAsSubs();
}
function loadAsSubs(){
  const sem=document.getElementById('asSem');if(!sem)return;
  const f=currentUser.obj;
  const subs=subjectsFor(f.branch,parseInt(sem.value));
  const isMySub=s=>(f.subjects||[]).some(fs=>s.toLowerCase().includes(fs.toLowerCase())||fs.toLowerCase().includes(s.toLowerCase()));
  document.getElementById('asSubj').innerHTML=subs.map(s=>`<option>${isMySub(s)?'★ ':''}${esc(s)}</option>`).join('');
}
async function postAssign(){
  const f=currentUser.obj;
  const title=val('asTitle');if(!title){toast('Title required','err');return;}
  const sem=parseInt(document.getElementById('asSem').value);
  const subj=document.getElementById('asSubj').value.replace(/^★ /,'');
  try{
    await db.collection("assignments").add({
      title,branch:f.branch,sem,subject:subj,dueDate:val('asDue'),description:val('asDesc'),postedBy:f.id,postedOn:Date.now()
    });
    toast('Assignment posted','ok');
  }catch(e){
    toast('Post failed: '+e.message,'err');
  }
}

function renderFAnnounce(mc){
  const f=currentUser.obj;
  const list=DB.announcements.filter(a=>a.branch==='All'||a.branch===f.branch).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.date-a.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Notices</h1>
    <p class="sub">Announcements for ${f.branch} & All Branches</p>
    ${list.length===0?`<div class="empty"><div class="em">📢</div><p>No notices yet.</p></div>`:
    list.map(a=>`<div class="noticeCard ${a.pinned?'pinned':''}">
      <div class="nt">${esc(a.title)} ${a.pinned?'📌':''}</div>
      <div class="nb">${esc(a.body)}</div>
      <div class="nmeta">${badge(a.type,'b-'+(a.type==='exam'?'warn':a.type==='event'?'info':'gold'))} ${a.branch==='All'?badge('All Branches','b-navy'):branchBadge(a.branch)} · by ${esc(a.author)} · ${fmtDate(a.date)}</div>
    </div>`).join('')}
  </div>`;
}

/* ---------- FACULTY: Profile with Subject Editor ---------- */
let _fEditing=false;
let _fSubjDraft=[];
let _fPicks=[];
function addFSubjByPick(i){
  if(_fPicks[i])addFSubjByName(_fPicks[i]);
}
function renderFProfile(mc){
  const f=currentUser.obj;
  if(_fEditing){
    mc.innerHTML=`<div class="page">
      <h1 class="ttl">Edit My Profile</h1>
      <div class="card">
        <div class="row2"><div class="field"><label>Name</label><input id="epName" class="input" value="${esc(f.name)}"></div>
        <div class="field"><label>Email</label><input id="epEmail" class="input" value="${esc(f.email)}"></div></div>
        <div class="row2"><div class="field"><label>Phone</label><input id="epPhone" class="input" value="${esc(f.phone)}"></div>
        <div class="field"><label>Designation</label><select id="epDesg" class="sel"><option ${f.designation==='Assistant Professor'?'selected':''}>Assistant Professor</option><option ${f.designation==='Associate Professor'?'selected':''}>Associate Professor</option><option ${f.designation==='Professor'?'selected':''}>Professor</option><option ${f.designation==='Lecturer'?'selected':''}>Lecturer</option><option ${f.designation==='Head of Department'?'selected':''}>Head of Department</option></select></div></div>
        <div class="row2"><div class="field"><label>Qualification</label><input id="epQual" class="input" value="${esc(f.qualification)}"></div>
        <div class="field"><label>Experience (years)</label><input id="epExp" type="number" class="input" value="${f.experience}"></div></div>
        <div class="row2"><div class="field"><label>Branch</label><select id="epBranch" class="sel">${BRANCHES.map(b=>`<option ${f.branch===b?'selected':''}>${b}</option>`).join('')}</select></div></div>
        <hr style="margin:16px 0;border:none;border-top:1px solid var(--border)">
        <h3 style="margin-bottom:10px">My Teaching Subjects</h3>
        <div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Add or remove subjects. Changes save to Firestore and sync to all dashboards instantly.</div>
        <div id="fSubjList" style="margin-bottom:12px"></div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input id="fNewSubj" class="input" style="flex:1" placeholder="Type a subject name and press Add" onkeydown="if(event.key==='Enter')addFSubj()">
          <button class="btn btn-teal btn-sm" onclick="addFSubj()">+ Add</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Or pick from your branch syllabus:</div>
        <div id="fSyllabusPicks" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:16px"></div>
        <hr style="margin:16px 0;border:none;border-top:1px solid var(--border)">
        <h3 style="margin-bottom:10px">Change Password (optional)</h3>
        <div class="row2"><div class="field"><label>New Password</label><input id="epPwd" type="password" class="input" placeholder="Leave blank to keep"></div>
        <div class="field"><label>Confirm Password</label><input id="epPwd2" type="password" class="input" placeholder="Repeat new password"></div></div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn btn-teal" onclick="saveFProfile()">💾 Save All Changes</button>
          <button class="btn btn-ghost" onclick="_fEditing=false;renderFProfile(document.getElementById('mainContent'))">✕ Cancel</button>
        </div>
      </div></div>`;
    _fSubjDraft=(f.subjects||[]).slice();
    renderFSubjEditor(f);
    return;
  }
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Profile</h1>
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        ${av(initials(f.name),56,BRANCH_COLOR[f.branch])}
        <div><div style="font-size:18px;font-weight:700;color:var(--navy)">${esc(f.name)}</div>
        <div style="font-size:13px;color:var(--muted)">${esc(f.designation)} · ${f.branch}</div>
        <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">${badge(f.designation,'b-teal')}${branchBadge(f.branch)}${badge("Joined "+fmtDate(f.joinedOn),'b-navy')}</div></div>
      </div>
      <div class="grid2">
        <div><div class="lbl">Email</div><div style="font-size:13px">${esc(f.email)}</div></div>
        <div><div class="lbl">Phone</div><div style="font-size:13px">${esc(f.phone)}</div></div>
        <div><div class="lbl">Qualification</div><div style="font-size:13px">${esc(f.qualification)}</div></div>
        <div><div class="lbl">Experience</div><div style="font-size:13px">${f.experience} years</div></div>
        <div style="grid-column:span 2"><div class="lbl">Teaching Subjects</div><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px">${(f.subjects||[]).map(s=>badge(s,'b-teal')).join('')||'<span style="color:var(--muted)">None assigned</span>'}</div></div>
      </div>
      <button class="btn btn-teal" style="margin-top:14px" onclick="_fEditing=true;renderFProfile(document.getElementById('mainContent'))">✏️ Edit Profile</button>
    </div></div>`;
}
function renderFSubjEditor(f){
  const list=document.getElementById('fSubjList');
  if(!list)return;
  if(_fSubjDraft.length===0){
    list.innerHTML='<div style="font-size:13px;color:var(--muted);padding:8px 0">No subjects yet. Add some below.</div>';
  } else {
    list.innerHTML=_fSubjDraft.map((s,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
      <span class="badge b-teal">${esc(s)}</span>
      <button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="removeFSubj(${i})">✕ Remove</button>
    </div>`).join('');
  }
  // syllabus picks
  const branchSubs=[];
  for(let sem=1;sem<=8;sem++){subjectsFor(f.branch,sem).forEach(s=>{if(!branchSubs.includes(s))branchSubs.push(s);});}
  const available=branchSubs.filter(s=>!_fSubjDraft.includes(s));
  const picks=document.getElementById('fSyllabusPicks');
  _fPicks=available;
  picks.innerHTML=available.length===0?'<span style="font-size:12px;color:var(--muted)">All syllabus subjects already added.</span>':
    available.map((s,i)=>`<button class="btn btn-ghost btn-sm" onclick="addFSubjByPick(${i})">${esc(s)}</button>`).join('');
}
function addFSubj(){
  const inp=document.getElementById('fNewSubj');
  const v=inp.value.trim();if(!v)return;
  addFSubjByName(v);
  inp.value='';
}
function addFSubjByName(name){
  if(!_fSubjDraft.includes(name))_fSubjDraft.push(name);
  const f=currentUser.obj;
  renderFSubjEditor(f);
}
function removeFSubj(i){
  _fSubjDraft.splice(i,1);
  const f=currentUser.obj;
  renderFSubjEditor(f);
}
async function saveFProfile(){
  const f=currentUser.obj;
  try{
    const updates={
      name:val('epName'),phone:val('epPhone'),
      designation:document.getElementById('epDesg').value,qualification:val('epQual'),
      experience:parseInt(val('epExp')||"0"),branch:document.getElementById('epBranch').value,
      subjects:_fSubjDraft.slice()
    };
    await db.collection("faculty").doc(f.id).update(updates);
    Object.assign(currentUser.obj,updates);
    const np=val('epPwd');
    if(np){
      if(np!==val('epPwd2')){toast('Passwords do not match','err');return;}
      await auth.currentUser.updatePassword(np);
    }
    _fEditing=false;toast('Profile updated — syncing to all devices','ok');
    document.getElementById('sidebar').innerHTML=sideContent();
    renderFProfile(document.getElementById('mainContent'));
  }catch(e){
    toast('Update failed: '+e.message,'err');
  }
}

/* ---------- STUDENT DASHBOARD ---------- */
function renderStudent(tab,mc){
  if(tab==='s_home')renderSHome(mc);
  else if(tab==='s_att')renderSAtt(mc);
  else if(tab==='s_subs')renderSSubs(mc);
  else if(tab==='s_assign')renderSAssign(mc);
  else if(tab==='s_ann')renderSAnn(mc);
  else if(tab==='s_marks')renderSMarks(mc);
  else if(tab==='s_timetable')renderSTimetable(mc);
  else if(tab==='s_materials')renderSMaterials(mc);
  else if(tab==='s_calendar')renderSCalendar(mc);
  else if(tab==='s_fac')renderSFac(mc);
  else if(tab==='s_chat')renderSChat(mc);
  else if(tab==='s_profile')renderSProfile(mc);
}
function renderSHome(mc){
  const s=currentUser.obj;
  const att=overallAtt(s.id,s.branch,s.sem);
  const subs=subjectsFor(s.branch,s.sem);
  const notices=DB.announcements.filter(a=>a.branch==='All'||a.branch===s.branch).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.date-a.date);
  const facCount=DB.faculty.filter(f=>f.branch===s.branch).length;
  mc.innerHTML=`<div class="page">
    <div class="heroBanner"><div><h2>Welcome, ${esc(s.name)}</h2><p>${esc(s.usn)} · ${s.branch} · Sem ${s.sem} · Sec ${s.section}</p></div>
      ${att!=null?badge('Attendance '+att+'%',att>=75?'b-success':'b-danger'):'<span class="badge b-navy">No attendance yet</span>'}</div>
    <div class="grid4" style="margin-bottom:16px">
      <div class="statCard"><div class="ic">📘</div><div class="num">${subs.length}</div><div class="lbl">Subjects</div></div>
      <div class="statCard"><div class="ic">📢</div><div class="num">${notices.length}</div><div class="lbl">Notices</div></div>
      <div class="statCard"><div class="ic">👨‍🏫</div><div class="num">${facCount}</div><div class="lbl">Faculty Count</div></div>
      <div class="statCard"><div class="ic">✓</div><div class="num">${att==null?'—':att+'%'}</div><div class="lbl">Attendance %</div></div>
    </div>
    <div class="grid2" style="margin-bottom:16px">
      <div class="card"><h3>Latest Notices</h3>${notices.length===0?'<div class="empty" style="padding:14px"><p>No notices</p></div>':notices.slice(0,4).map(a=>`<div class="noticeCard ${a.pinned?'pinned':''}" style="margin-bottom:8px"><div class="nt" style="font-size:13px">${esc(a.title)}</div><div class="nb" style="font-size:12px">${esc(a.body).slice(0,90)}...</div></div>`).join('')}</div>
      <div class="card"><h3>Sem ${s.sem} Subjects</h3>${subs.slice(0,5).map((su,i)=>`<div style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid var(--border)"><span class="badge b-navy">${i+1}</span><span style="font-size:13px">${esc(su)}</span></div>`).join('')}</div>
    </div>
    <h3 style="margin-bottom:10px;color:var(--navy)">My Marks Overview</h3>
    <div class="card">${studentMarksSummary(s)}</div>
  </div>`;
}
function renderSAtt(mc){
  const s=currentUser.obj;
  const att=calcAtt(s.id,s.branch,s.sem);
  const overall=overallAtt(s.id,s.branch,s.sem);
  const tracked=att.length;
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Attendance</h1>
    <p class="sub">Subject-wise breakdown · VTU minimum 75%</p>
    <div class="grid3" style="margin-bottom:18px">
      <div class="statCard"><div class="ic">📊</div><div class="num">${overall==null?'—':overall+'%'}</div><div class="lbl">Overall %</div></div>
      <div class="statCard"><div class="ic">🎯</div><div class="num">75%</div><div class="lbl">VTU Minimum</div></div>
      <div class="statCard"><div class="ic">📘</div><div class="num">${tracked}</div><div class="lbl">Subjects Tracked</div></div>
    </div>
    ${tracked===0?`<div class="empty"><div class="em">📋</div><p>No attendance marked yet. It will appear here once faculty records it.</p></div>`:
    att.map((a,i)=>{
      const col=a.pct>=75?'var(--success)':a.pct>=60?'var(--gold)':'var(--danger)';
      const grad=a.pct>=75?'linear-gradient(90deg,var(--success),var(--teal))':a.pct>=60?'linear-gradient(90deg,var(--gold),var(--goldLt))':'linear-gradient(90deg,var(--danger),#e57373)';
      const ok=a.pct>=75;
      let extra='';
      if(!ok){
        const need=Math.ceil((0.75*a.total-a.present)/0.25);
        extra=`<span class="badge b-warn" style="margin-top:6px">Attend ${need} more to reach 75%</span>`;
      } else {
        const canMiss=Math.floor(a.present-0.75*a.total);
        extra=`<div style="font-size:11.5px;color:var(--success);margin-top:5px">Can miss ${canMiss} more classes</div>`;
      }
      return `<div class="card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <span class="badge b-navy">${i+1}</span>
          <b style="flex:1;font-size:14px;color:var(--navy)">${esc(a.sub)}</b>
          <b style="font-size:20px;color:${col}">${a.pct}%</b>
          <span style="font-size:18px">${ok?'✅':'⚠️'}</span>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:6px">${a.present}/${a.total} classes · ${ok?'On track ✓':'Needs improvement'}</div>
        <div class="bar"><span style="width:${a.pct}%;background:${grad}"></span></div>
        ${extra}
      </div>`;
    }).join('')}
  </div>`;
}
function renderSSubs(mc){
  const s=currentUser.obj;
  const subs=subjectsFor(s.branch,s.sem);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Subjects</h1>
    <p class="sub">${s.branch} · Semester ${s.sem} · ${subs.length} subjects</p>
    <div class="grid3">${subs.map((su,i)=>{
      const sp=subjectPct(s.id,su);
      const col=sp==null?'var(--border)':sp.pct>=75?'var(--success)':sp.pct>=60?'var(--gold)':'var(--danger)';
      return `<div class="subjCard" style="border-top-color:${BRANCH_COLOR[s.branch]}">
        <div class="sjI">📘</div>
        <div class="sjT">${esc(su)}</div>
        <div style="display:flex;gap:5px;margin:6px 0">${branchBadge(s.branch)}${badge("Sem "+s.sem,"b-info")}</div>
        ${sp!=null?`<div class="bar" style="margin-top:8px"><span style="width:${sp.pct}%;background:${col}"></span></div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:4px">${sp.pct}% · ${sp.present}/${sp.total}</div>`:''}
      </div>`;}).join('')}
    </div>
  </div>`;
}
function renderSAssign(mc){
  const s=currentUser.obj;
  const list=DB.assignments.filter(a=>a.branch===s.branch && a.sem===s.sem);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Assignments</h1>
    <p class="sub">${s.branch} · Sem ${s.sem} · ${list.length} assignment(s)</p>
    ${list.length===0?`<div class="empty"><div class="em">📝</div><p>No assignments for your branch & semester yet.</p></div>`:
    list.slice().reverse().map(a=>{const f=DB.faculty.find(x=>x.id===a.postedBy);return `<div class="card" style="margin-bottom:10px">
      <div style="font-weight:700;color:var(--navy)">📝 ${esc(a.title)}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin:7px 0">${badge(a.subject,'b-teal')}${branchBadge(a.branch)}${badge("Sem "+a.sem,"b-info")}${badge("Due "+a.dueDate,'b-warn')}</div>
      <div style="font-size:12.5px;color:#3a4a5d">${esc(a.description)||'<i style="color:var(--muted)">No description</i>'}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:6px">Posted by ${f?esc(f.name):'Faculty'} · ${fmtDate(a.postedOn)}</div>
    </div>`;}).join('')}
  </div>`;
}
function renderSAnn(mc){
  const s=currentUser.obj;
  const list=DB.announcements.filter(a=>a.branch==='All'||a.branch===s.branch).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.date-a.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Notices</h1>
    <p class="sub">${s.branch} & All Branches · ${list.length} notice(s)</p>
    ${list.length===0?`<div class="empty"><div class="em">📢</div><p>No notices yet.</p></div>`:
    list.map(a=>`<div class="noticeCard ${a.pinned?'pinned':''}">
      <div class="nt">${esc(a.title)} ${a.pinned?'📌':''}</div>
      <div class="nb">${esc(a.body)}</div>
      <div class="nmeta">${badge(a.type,'b-'+(a.type==='exam'?'warn':a.type==='event'?'info':'gold'))} ${a.branch==='All'?badge('All Branches','b-navy'):branchBadge(a.branch)} · by ${esc(a.author)} · ${fmtDate(a.date)}</div>
    </div>`).join('')}
  </div>`;
}
function renderSFac(mc){
  const s=currentUser.obj;
  const list=DB.faculty.filter(f=>f.branch===s.branch);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Faculty</h1>
    <p class="sub">${s.branch} branch · ${list.length} faculty</p>
    ${list.length===0?`<div class="empty"><div class="em">👨‍🏫</div><p>No faculty in your branch yet.</p></div>`:
    `<div class="grid3">${list.map(f=>`<div class="card">
      <div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
        ${av(initials(f.name),44,BRANCH_COLOR[s.branch])}
        <div><div style="font-weight:700;color:var(--navy)">${esc(f.name)}</div>
        <div style="font-size:12px;color:var(--muted)">${esc(f.designation)}</div></div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px">✉ ${esc(f.email)}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">${(f.subjects||[]).map(x=>badge(x,'b-teal')).join('')||'<span style="font-size:12px;color:var(--muted)">No subjects assigned</span>'}</div>
      <button class="btn btn-gold btn-sm" onclick="startChat('${f.id}')">💬 Send Message</button>
    </div>`).join('')}</div>`}
  </div>`;
}
function startChat(fid){chatTarget=fid;navTo('s_chat');}

function renderSChat(mc){
  const s=currentUser.obj;
  const list=DB.faculty.filter(f=>f.branch===s.branch);
  if(!chatTarget && list.length>0)chatTarget=list[0].id;
  const f=list.find(x=>x.id===chatTarget);
  const msgs=DB.messages.filter(m=>m.facultyId===chatTarget && m.studentId===s.id).sort((a,b)=>a.time-b.time);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Messages</h1>
    <p class="sub">Chat with faculty · AI-powered replies</p>
    <div class="chatWrap">
      <div class="chatList" id="chatListCol">
        ${list.length===0?'<div class="empty" style="padding:20px"><div class="em">👨‍🏫</div><p>No faculty</p></div>':
        list.map(x=>`<div class="chatListItem ${x.id===chatTarget?'active':''}" onclick="chatTarget='${x.id}';renderSChat(document.getElementById('mainContent'))">
          ${av(initials(x.name),34,BRANCH_COLOR[s.branch])}
          <div><div class="nm">${esc(x.name)}</div><div class="ds">${esc(x.designation)}</div></div>
        </div>`).join('')}
      </div>
      <div class="chatArea">
        ${!f?'<div class="empty" style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="em">💬</div><p>Select a faculty to start chatting</p></div>':
        `<div class="chatTop">${av(initials(f.name),34,BRANCH_COLOR[s.branch])}<div><div style="font-weight:700;color:var(--navy)">${esc(f.name)}</div><div style="font-size:11px;color:var(--muted)">${esc(f.designation)} · ${(f.subjects||[]).join(', ')}</div></div></div>
        <div class="chatMsgs" id="chatMsgs">${msgs.map(m=>`<div class="msg ${m.from==='student'?'me':'them'}">${esc(m.text)}<div class="mt">${fmtTime(m.time)}</div></div>`).join('')||'<div style="text-align:center;color:var(--muted);font-size:13px;padding:20px">Start the conversation 👋</div>'}</div>
        <div class="chatTyping" id="chatTyping" style="display:none">Professor is typing...</div>
        <div class="chatInput"><input id="chatInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMsg()"><button class="btn btn-gold" onclick="sendMsg()">Send</button></div>`}
      </div>
    </div>
  </div>`;
  scrollChat();
}
function scrollChat(){const el=document.getElementById('chatMsgs');if(el)el.scrollTop=el.scrollHeight;}
async function sendMsg(){
  const s=currentUser.obj;
  const inp=document.getElementById('chatInput');
  const text=inp.value.trim();if(!text)return;
  try{
    await db.collection("messages").add({
      facultyId:chatTarget,studentId:s.id,from:'student',text,time:Date.now()
    });
    inp.value='';
  }catch(e){
    toast('Message failed: '+e.message,'err');
  }
  const f=DB.faculty.find(x=>x.id===chatTarget);
  if(!f)return;
  const typing=document.getElementById('chatTyping');
  if(typing)typing.style.display='block';
  const sysPrompt=`You are ${f.name}, a ${f.designation} at GEC Arsikere teaching ${(f.subjects||[]).join(', ')}. Student ${s.name} (${s.branch} Sem ${s.sem}) messages you. Reply warmly as a professor. Max 2 sentences.`;
  try{
    const resp=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:API_MODEL,max_tokens:180,system:sysPrompt,
        messages:[{role:'user',content:text}]})});
    const data=await resp.json();
    let reply=(data.content && data.content[0] && data.content[0].text) || "I'll respond to you shortly!";
    await db.collection("messages").add({
      facultyId:chatTarget,studentId:s.id,from:'faculty',text:reply,time:Date.now()
    });
  }catch(e){
    await db.collection("messages").add({
      facultyId:chatTarget,studentId:s.id,from:'faculty',text:"I'll respond to you shortly!",time:Date.now()
    });
  }
}

function renderSProfile(mc){
  const s=currentUser.obj;
  const year=Math.ceil(s.sem/2);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Profile</h1>
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        ${av(initials(s.name),56,BRANCH_COLOR[s.branch])}
        <div><div style="font-size:18px;font-weight:700;color:var(--navy)">${esc(s.name)}</div>
        <div style="font-size:13px;color:var(--muted)">${esc(s.usn)}</div>
        <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">${branchBadge(s.branch)}${badge("Sem "+s.sem+" · Year "+year,"b-info")}${badge("Sec "+s.section,"b-navy")}${badge("✓ Approved","b-success")}</div></div>
      </div>
      <div class="grid2">
        <div><div class="lbl">Email</div><div style="font-size:13px">${esc(s.email)}</div></div>
        <div><div class="lbl">Phone</div><div style="font-size:13px">${esc(s.phone)}</div></div>
        <div><div class="lbl">Date of Birth</div><div style="font-size:13px">${esc(s.dob)}</div></div>
        <div><div class="lbl">Address</div><div style="font-size:13px">${esc(s.address)}</div></div>
        <div><div class="lbl">Father's Name</div><div style="font-size:13px">${esc(s.fatherName)}</div></div>
        <div><div class="lbl">Mother's Name</div><div style="font-size:13px">${esc(s.motherName)}</div></div>
        <div style="grid-column:span 2"><div class="lbl">Registered On</div><div style="font-size:13px">${fmtDate(s.joinedOn)}</div></div>
      </div>
    </div></div>`;
}

/* ---------- FACULTY: Marks Management ---------- */
let _mkBranch=null,_mkSem=null,_mkSubject=null,_mkMaxMarks=100;
function renderFMarks(mc){
  const f=currentUser.obj;
  if(!_mkBranch)_mkBranch=f.branch;
  if(!_mkSem)_mkSem=1;
  const subs=subjectsFor(_mkBranch,parseInt(_mkSem));
  const students=DB.students.filter(s=>s.branch===_mkBranch && s.sem===parseInt(_mkSem));
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Marks Management</h1>
    <p class="sub">Enter marks for students in your branch</p>
    <div class="split">
      <div class="card">
        <div class="row3" style="margin-bottom:10px">
          <div class="field"><label>Branch</label><select class="sel" onchange="_mkBranch=this.value;renderFMarks(document.getElementById('mainContent'))">${BRANCHES.map(b=>`<option ${_mkBranch===b?'selected':''}>${b}</option>`).join('')}</select></div>
          <div class="field"><label>Semester</label><select class="sel" onchange="_mkSem=this.value;_mkSubject=null;renderFMarks(document.getElementById('mainContent'))">${[1,2,3,4,5,6,7,8].map(s=>`<option ${_mkSem==s?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Subject</label><select class="sel" onchange="_mkSubject=this.value;renderFMarks(document.getElementById('mainContent'))"><option value="">Select subject...</option>${subs.map(s=>`<option ${_mkSubject===s?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
        </div>
        <div class="row2" style="margin-bottom:10px">
          <div class="field"><label>Exam Title</label><input id="mkExam" class="input" placeholder="e.g. Internal 1" value="Internal 1"></div>
          <div class="field"><label>Max Marks</label><input id="mkMax" type="number" class="input" value="${_mkMaxMarks}" onchange="_mkMaxMarks=parseInt(this.value)"></div>
        </div>
        ${_mkSubject?`<div id="mkRows">${mkRows(students)}</div>
        <button class="btn btn-teal" style="margin-top:12px;width:100%" onclick="saveMk()">💾 Save Marks</button>`:'<div class="empty"><div class="em">🎯</div><p>Select a subject to enter marks.</p></div>'}
      </div>
      <div class="card stickyR">
        <h3>Recent Marks Entered</h3>
        ${DB.marks.filter(m=>m.branch===_mkBranch && m.sem===parseInt(_mkSem)).slice(-8).reverse().map(m=>{const s=DB.students.find(x=>x.id===m.studentId);return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><div style="flex:1;font-size:12px"><b style="color:var(--navy)">${s?esc(s.name):'Unknown'}</b> · ${esc(m.subject)}</div><span class="badge b-teal">${m.scoredMarks}/${m.maxMarks}</span></div>`;}).join('')||'<div class="empty" style="padding:14px"><p>No marks entered yet.</p></div>'}
      </div>
    </div>
  </div>`;
}
function mkRows(students){
  return students.map(s=>{const existing=DB.marks.find(m=>m.studentId===s.id && m.subject===_mkSubject && m.examTitle===val('mkExam'));
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
      ${av(initials(s.name),30,BRANCH_COLOR[_mkBranch])}
      <div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:600;color:var(--navy)">${esc(s.name)}</div><div style="font-size:11px;color:var(--muted)">${esc(s.usn)}</div></div>
      <input id="mk_${s.id}" type="number" min="0" class="input" style="width:80px" placeholder="Marks" value="${existing?existing.scoredMarks:''}">
    </div>`;}).join('');
}
async function saveMk(){
  if(!_mkSubject){toast('Select a subject','err');return;}
  const examTitle=val('mkExam');if(!examTitle){toast('Exam title required','err');return;}
  const maxMarks=parseInt(val('mkMax'))||100;
  const students=DB.students.filter(s=>s.branch===_mkBranch && s.sem===parseInt(_mkSem));
  let saved=0;const batch=db.batch();
  students.forEach(s=>{const inp=document.getElementById('mk_'+s.id);const v=inp.value;if(v!==''&&v!=null){const scored=parseInt(v);const docId=s.id+'_'+_mkSubject+'_'+examTitle;batch.set(db.collection("marks").doc(docId),{studentId:s.id,subject:_mkSubject,examTitle,scoredMarks:scored,maxMarks,branch:_mkBranch,sem:parseInt(_mkSem),date:Date.now(),enteredBy:currentUser.obj.id});saved++;}});
  try{await batch.commit();toast('Marks saved for '+saved+' students','ok');}catch(e){toast('Save failed: '+e.message,'err');}
}

/* ---------- FACULTY: Study Materials ---------- */
function renderFMaterials(mc){
  const f=currentUser.obj;
  const list=DB.materials.filter(m=>m.facultyId===f.id).sort((a,b)=>b.date-a.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Study Materials</h1>
    <p class="sub">Share PDF links or Google Drive resources with students</p>
    <div class="split">
      <div>
        <h3 style="margin-bottom:10px;color:var(--navy)">My Materials (${list.length})</h3>
        ${list.length===0?`<div class="empty"><div class="em">📚</div><p>No materials shared yet.</p></div>`:
        list.map(m=>`<div class="card" style="margin-bottom:10px">
          <div style="font-weight:700;color:var(--navy)">📚 ${esc(m.title)}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin:6px 0">${badge(m.subject,'b-teal')}${branchBadge(m.branch)}${badge("Sem "+m.sem,'b-info')}${badge(m.type==='pdf'?'📄 PDF':'🔗 Link','b-gold')}</div>
          <div style="font-size:12px;color:#3a4a5d;margin-bottom:6px">${esc(m.description)||''}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Added ${fmtDate(m.date)}</div>
          <div style="display:flex;gap:6px">
            <a href="${esc(m.url)}" target="_blank" class="btn btn-gold btn-sm">🔗 Open</a>
            <button class="btn btn-danger btn-sm" onclick="delMat('${m.id}')">🗑 Delete</button>
          </div>
        </div>`).join('')}
      </div>
      <div class="card stickyR">
        <h3>Add Material</h3>
        <div class="field"><label>Title *</label><input id="matTitle" class="input" placeholder="Material title"></div>
        <div class="row2">
          <div class="field"><label>Semester</label><select id="matSem" class="sel">${[1,2,3,4,5,6,7,8].map(s=>`<option>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Subject</label><input id="matSubject" class="input" placeholder="Subject"></div>
        </div>
        <div class="field"><label>Type</label><select id="matType" class="sel"><option value="pdf">📄 PDF Link</option><option value="link">🔗 Web Link</option></select></div>
        <div class="field"><label>URL *</label><input id="matUrl" class="input" placeholder="https://... (Google Drive, PDF link, etc.)"></div>
        <div class="field"><label>Description</label><textarea id="matDesc" class="txt" rows="2" placeholder="Optional notes"></textarea></div>
        <button class="btn btn-teal" style="width:100%" onclick="addMat()">➕ Add Material</button>
      </div>
    </div>
  </div>`;
}
async function addMat(){
  const f=currentUser.obj;
  const title=val('matTitle');if(!title){toast('Title required','err');return;}
  const url=val('matUrl');if(!url){toast('URL required','err');return;}
  try{
    await db.collection("materials").add({
      title,branch:f.branch,sem:parseInt(document.getElementById('matSem').value),
      subject:val('matSubject'),type:document.getElementById('matType').value,
      url,description:val('matDesc'),facultyId:f.id,facultyName:f.name,date:Date.now()
    });
    toast('Material added','ok');
  }catch(e){toast('Add failed: '+e.message,'err');}
}
async function delMat(id){
  try{await db.collection("materials").doc(id).delete();toast('Material deleted','ok');}
  catch(e){toast('Delete failed: '+e.message,'err');}
}

/* ---------- STUDENT: Marks ---------- */
function renderSMarks(mc){
  const s=currentUser.obj;
  const marks=allMarksFor(s.id);
  const bySubject={};
  marks.forEach(m=>{if(!bySubject[m.subject])bySubject[m.subject]=[];bySubject[m.subject].push(m);});
  const subjects=Object.keys(bySubject).sort();
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Marks</h1>
    <p class="sub">All your test & exam marks</p>
    ${marks.length===0?`<div class="empty"><div class="em">🎯</div><p>No marks entered yet. They will appear here once faculty records them.</p></div>`:
    `<div class="grid3" style="margin-bottom:16px">
      <div class="statCard"><div class="ic">📚</div><div class="num">${subjects.length}</div><div class="lbl">Subjects</div></div>
      <div class="statCard"><div class="ic">📝</div><div class="num">${marks.length}</div><div class="lbl">Exams</div></div>
      <div class="statCard"><div class="ic">📊</div><div class="num">${avgMarks(s.id)||'—'}%</div><div class="lbl">Overall Avg</div></div>
    </div>
    ${subjects.map(sub=>{const arr=bySubject[sub];const avg=avgMarks(s.id,sub);const col=avg==null?'var(--muted)':avg>=75?'var(--success)':avg>=50?'var(--gold)':'var(--danger)';
      return `<div class="card" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <b style="flex:1;font-size:14px;color:var(--navy)">${esc(sub)}</b>
          <b style="font-size:18px;color:${col}">${avg==null?'—':avg+'%'}</b>
        </div>
        ${arr.map(m=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
          <span style="flex:1;font-size:12px">${esc(m.examTitle)}</span>
          <span style="font-size:12px;color:var(--muted)">${fmtDate(m.date)}</span>
          <span class="badge b-teal">${m.scoredMarks}/${m.maxMarks}</span>
        </div>`).join('')}
      </div>`;}).join('')}`}
  </div>`;
}
function studentMarksSummary(s){
  const marks=allMarksFor(s.id);
  if(marks.length===0)return '<div class="empty" style="padding:14px"><p>No marks recorded yet.</p></div>';
  const bySubject={};marks.forEach(m=>{if(!bySubject[m.subject])bySubject[m.subject]=[];bySubject[m.subject].push(m);});
  return Object.keys(bySubject).sort().map(sub=>{const avg=avgMarks(s.id,sub);const col=avg==null?'var(--muted)':avg>=75?'var(--success)':avg>=50?'var(--gold)':'var(--danger)';
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><span style="flex:1;font-size:12.5px;font-weight:600;color:var(--navy)">${esc(sub)}</span><b style="color:${col};font-size:13px">${avg==null?'—':avg+'%'}</b></div>`;}).join('');
}

/* ---------- STUDENT: Timetable ---------- */
function renderSTimetable(mc){
  const s=currentUser.obj;
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">My Timetable</h1>
    <p class="sub">${s.branch} · Semester ${s.sem}</p>
    ${DAYS.map(day=>{const periods=timetableByDay(s.branch,s.sem,day);if(periods.length===0)return '';
      return `<div class="card" style="margin-bottom:10px"><h3 style="margin-bottom:8px;color:var(--navy)">${day}</h3>
      ${periods.map(p=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span class="badge b-navy">P${p.period}</span>
        <div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--navy)">${esc(p.subject)}</div>
        <div style="font-size:11px;color:var(--muted)">${esc(p.startTime||'')} - ${esc(p.endTime||'')} · ${esc(p.facultyName||'TBD')}</div></div>
      </div>`).join('')}</div>`;}).join('')||'<div class="empty"><div class="em">📅</div><p>No timetable published yet.</p></div>'}
  </div>`;
}

/* ---------- STUDENT: Study Materials ---------- */
function renderSMaterials(mc){
  const s=currentUser.obj;
  const list=DB.materials.filter(m=>m.branch===s.branch && m.sem===s.sem).sort((a,b)=>b.date-a.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Study Materials</h1>
    <p class="sub">${s.branch} · Sem ${s.sem} · ${list.length} material(s)</p>
    ${list.length===0?`<div class="empty"><div class="em">📚</div><p>No materials shared for your class yet.</p></div>`:
    list.map(m=>`<div class="card" style="margin-bottom:10px">
      <div style="font-weight:700;color:var(--navy)">📚 ${esc(m.title)}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin:6px 0">${badge(m.subject||'General','b-teal')}${badge(m.type==='pdf'?'📄 PDF':'🔗 Link','b-gold')}</div>
      <div style="font-size:12px;color:#3a4a5d;margin-bottom:6px">${esc(m.description)||''}</div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:8px">By ${esc(m.facultyName||'Faculty')} · ${fmtDate(m.date)}</div>
      <a href="${esc(m.url)}" target="_blank" class="btn btn-gold btn-sm">🔗 Open Material</a>
    </div>`).join('')}
  </div>`;
}

/* ---------- STUDENT: Calendar ---------- */
function renderSCalendar(mc){
  const list=DB.calendar.slice().sort((a,b)=>a.date-b.date);
  mc.innerHTML=`<div class="page">
    <h1 class="ttl">Academic Calendar</h1>
    <p class="sub">Holidays, exams & events</p>
    ${list.length===0?`<div class="empty"><div class="em">🗓️</div><p>No calendar events yet.</p></div>`:
    list.map(c=>`<div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px">${c.type==='holiday'?'🏖️':c.type==='exam'?'📝':'🎉'}</span>
        <div style="flex:1"><div style="font-weight:700;color:var(--navy)">${esc(c.title)}</div>
        <div style="font-size:12px;color:var(--muted)">${fmtDate(c.date)}${c.description?' · '+esc(c.description):''}</div></div>
      </div>
      <div style="margin-top:6px">${badge(c.type,'b-'+(c.type==='holiday'?'info':c.type==='exam'?'warn':'gold'))}</div>
    </div>`).join('')}
  </div>`;
}

/* ---------- Boot ---------- */
startListeners();
seedAnnouncements();

auth.onAuthStateChanged(async (user)=>{
  if(user && !currentUser){
    if(user.email === ADMIN_EMAIL){
      currentUser={role:'admin',obj:{email:ADMIN_EMAIL,name:'Administrator'}};
      startListeners();
      enterApp();
      return;
    }
    const fDoc = await db.collection("faculty").doc(user.uid).get();
    if(!currentUser && fDoc.exists){
      currentUser={role:'faculty',obj:{id:fDoc.id,...fDoc.data()}};
      startListeners();
      enterApp();
      return;
    }
    if(!currentUser){
      const sDoc = await db.collection("students").doc(user.uid).get();
      if(sDoc.exists){
        currentUser={role:'student',obj:{id:sDoc.id,...sDoc.data()}};
        startListeners();
        enterApp();
        return;
      }
    }
    if(!currentUser){
      const pDoc = await db.collection("pendingStudents").doc(user.uid).get();
      if(pDoc.exists){
        await auth.signOut();
        toast('Your account is pending admin approval','err');
        renderAuth();
        return;
      }
    }
  } else if(!user && currentUser){
    unsubscribers.forEach(u=>{try{u()}catch(e){}});
    unsubscribers=[];
    currentUser=null;activeTab=null;
    renderAuth();
  }
});

renderAuth();
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closePM();}});
