const SUPABASE_URL = "https://kdeipenudegjcmrmrvcu.supabase.co";
const SUPABASE_KEY = "sb_publishable_5iRCAo4Oxj-e9Ux93sOGpA_-xP91JOF";
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =========================
   SUPABASE GİRİŞ SİSTEMİ
   ========================= */

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("loginMessage");

  message.textContent = "";

  if (!email || !password) {
    message.textContent = "E-posta ve şifreyi girin.";
    return;
  }

  message.textContent = "Giriş yapılıyor...";

  const { error } = await db.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    message.textContent = "E-posta veya şifre hatalı.";
    return;
  }

  message.textContent = "";
  document.getElementById("loginScreen").style.display = "none";
}


/* Oturum daha önce açılmışsa giriş ekranını gösterme */

async function checkSession() {
  const { data } = await db.auth.getSession();

  if (data.session) {
    document.getElementById("loginScreen").style.display = "none";
  } else {
    document.getElementById("loginScreen").style.display = "flex";
  }
}

checkSession();
/* =========================================================
   BAKIRÇAY KÜTÜPHANE YÖNETİM SİSTEMİ
   Dewey + Tür + Alt Tür + Benzersiz Kitap Kodu
   ========================================================= */

let books = [];
let students = [];
let loans = [];

const $ = id => document.getElementById(id);

/* =========================================================
   SUPABASE'DEN KİTAPLARI GETİR
   ========================================================= */

async function loadBooks() {
  const { data, error } = await db
    .from("kitaplar")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Kitaplar yüklenemedi:", error);
    alert("Kitaplar yüklenirken bir hata oluştu.");
    return;
  }

  books = (data || []).map(book => ({
    id: book.id,
    qr: book.qr_no,
    name: book.kitap_adi,
    author: book.yazar,
    type: book.tur,
    subtype: book.alt_tur || "",
    dewey: book.dewey || "",
    cab: book.dolap || "",
    shelf: book.raf || "",
    order: book.sira || ""
  }));

  render();
}

/* =========================
   SUPABASE'DEN ÖĞRENCİLERİ GETİR
   ========================= */

async function loadStudents() {
  const { data, error } = await db
    .from("ogrenciler")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Öğrenciler yüklenirken hata:", error);
    alert("Öğrenciler yüklenirken bir hata oluştu.");
    return;
  }

  students = (data || []).map(student => ({
    id: student.id,
    name: student.ad_soyad,
    cls: student.sinif,
    branch: student.sube,
    no: student.okul_no
  }));

  render();
}
/* =========================================================
   SINIFLANDIRMA SİSTEMİ
   ========================================================= */

const categories = {

  "Genel Eserler": {
    dewey: "000",
    code: "GE"
  },

  "Felsefe ve Psikoloji": {
    dewey: "100",
    code: "FP"
  },

  "Din": {
    dewey: "200",
    code: "Dİ"
  },

  "Sosyal Bilimler": {
    dewey: "300",
    code: "SB"
  },

  "Dil": {
    dewey: "400",
    code: "DİL"
  },

  "Fen Bilimleri": {
    dewey: "500",
    code: "FB"
  },

  "Teknoloji": {
    dewey: "600",
    code: "TE"
  },

  "Sanat ve Eğlence": {
    dewey: "700",
    code: "SE"
  },

  "Edebiyat": {
    dewey: "800",
    code: "ED"
  },

  "Tarih ve Coğrafya": {
    dewey: "900",
    code: "TC"
  },

  "Roman": {
    dewey: "813",
    code: "R",
    subtypes: {

      "Psikolojik Roman": "PR",
      "Polisiye Roman": "PO",
      "Çocuk Romanı": "ÇR",
      "Tarihi Roman": "TR",
      "Bilim Kurgu Romanı": "BK",
      "Fantastik Roman": "FR",
      "Macera Romanı": "MR",
      "Aşk Romanı": "AR",
      "Gerilim Romanı": "GR",
      "Distopya Romanı": "DR",
      "Biyografik Roman": "BR",
      "Toplumsal Roman": "SR",
      "Klasik Roman": "KR",
      "Diğer Roman": "R"
    }
  }

};


/* =========================================================
   KAYDET
   ========================================================= */

function save() {

  localStorage.setItem("books", JSON.stringify(books));
  localStorage.setItem("students", JSON.stringify(students));
  localStorage.setItem("loans", JSON.stringify(loans));

  render();
}


/* =========================================================
   MENÜ
   ========================================================= */

document.querySelectorAll("aside button").forEach(button => {

  button.onclick = () => {

    document.querySelectorAll(".page").forEach(page =>
      page.classList.remove("active")
    );

    $(button.dataset.page).classList.add("active");

    $("menu").classList.remove("open");

    render();
  };

});

$("menuBtn").onclick = () =>
  $("menu").classList.toggle("open");


/* =========================================================
   FORM
   ========================================================= */

function openForm(id) {

  $(id).showModal();

  if (id === "bookForm") {
    prepareBookForm();
  }
}

function closeForm(id) {
  $(id).close();
}


/* =========================================================
   KİTAP FORMU
   ========================================================= */

function prepareBookForm() {

  const typeSelect = $("bType");

  if (!typeSelect) return;

  typeSelect.innerHTML =
    '<option value="">Tür seçin</option>';

  Object.keys(categories).forEach(type => {

    const option = document.createElement("option");

    option.value = type;
    option.textContent = type;

    typeSelect.appendChild(option);
  });

  /* Manuel tür */

  const manual = document.createElement("option");

  manual.value = "__manual__";
  manual.textContent = "+ Listede olmayan tür";

  typeSelect.appendChild(manual);

  typeSelect.onchange = handleTypeChange;

  handleTypeChange();
}


/* =========================================================
   TÜR DEĞİŞTİRİLDİĞİNDE
   ========================================================= */

function handleTypeChange() {

  const type = $("bType")?.value;

  const subtype = $("bSubtype");
  const manualType = $("bManualType");
  const dewey = $("bDewey");
  const codePreview = $("bCodePreview");

  if (subtype) {
    subtype.innerHTML =
      '<option value="">Alt tür seçin</option>';
  }

  if (manualType) {
    manualType.style.display = "none";
  }

  if (!type) {

    if (dewey) dewey.value = "";
    if (codePreview) codePreview.value = "";

    if (subtype) subtype.style.display = "none";

    return;
  }


  /* MANUEL TÜR */

  if (type === "__manual__") {

    if (manualType) {
      manualType.style.display = "block";
    }

    if (subtype) {
      subtype.style.display = "none";
    }

    if (dewey) {
      dewey.value = "";
      dewey.placeholder = "Dewey kodunu girin";
      dewey.readOnly = false;
    }

    if (codePreview) {
      codePreview.value = "";
    }

    return;
  }


  /* NORMAL TÜR */

  const data = categories[type];

  if (dewey) {

    dewey.value = data.dewey;
    dewey.readOnly = true;
  }


  /* ROMAN ALT TÜRLERİ */

  if (data.subtypes && subtype) {

    subtype.style.display = "block";

    Object.entries(data.subtypes).forEach(([name, code]) => {

      const option = document.createElement("option");

      option.value = name;
      option.dataset.code = code;
      option.textContent = `${name} [${code}]`;

      subtype.appendChild(option);
    });

    subtype.onchange = updateCodePreview;

  } else if (subtype) {

    subtype.style.display = "none";
  }

  updateCodePreview();
}


/* =========================================================
   TÜRKÇE HARFLERİ KOD İÇİN DÜZENLE
   ========================================================= */

function normalizeCode(text) {

  return String(text || "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, "")
    .replace(/[^A-ZÇĞİÖŞÜ0-9]/g, "");
}


/* =========================================================
   BENZERSİZ SIRA NUMARASI
   ========================================================= */

function nextNumber(prefix) {

  let max = 0;

  books.forEach(book => {

    if (!book.qr) return;

    const parts = String(book.qr).split("-");

    if (parts[0] === prefix) {

      const number = parseInt(parts[1], 10);

      if (!isNaN(number) && number > max) {
        max = number;
      }
    }
  });

  return max + 1;
}


/* =========================================================
   KİTAP KODU OLUŞTUR
   ========================================================= */

function createBookCode(type, subtype, manualType) {

  let prefix = "KT";

  if (type === "__manual__") {

    const cleaned = normalizeCode(manualType);

    prefix = cleaned.substring(0, 2) || "KT";

  } else {

    const data = categories[type];

    if (type === "Roman" && subtype) {

      prefix =
        data.subtypes[subtype] ||
        "R";

    } else {

      prefix = data?.code || "KT";
    }
  }

  const number = nextNumber(prefix);

  return `${prefix}-${String(number).padStart(6, "0")}`;
}


/* =========================================================
   KOD ÖNİZLEME
   ========================================================= */

function updateCodePreview() {

  const preview = $("bCodePreview");

  if (!preview) return;

  const type = $("bType")?.value || "";
  const subtype = $("bSubType")?.value || "";
  const manualType = $("bManualType")?.value || "";

  if (!type) {

    preview.value = "";
    return;
  }

  let prefix = "KT";

  if (type === "__manual__") {

    prefix =
      normalizeCode(manualType).substring(0, 2) ||
      "KT";

  } else if (type === "Roman") {

    prefix =
      categories.Roman.subtypes[subtype] ||
      "R";

  } else {

    prefix =
      categories[type]?.code ||
      "KT";
  }

  preview.value =
    `${prefix}-${String(nextNumber(prefix)).padStart(6, "0")}`;
}


/* Manuel tür yazıldığında kodu güncelle */

if ($("bManualType")) {

  $("bManualType").addEventListener(
    "input",
    updateCodePreview
  );
}


/* =========================================================
   KİTAP KAYDET
   ========================================================= */

async function saveBook(event) {

  event.preventDefault();

  let type = $("bType")?.value || "";
  let subtype = $("bSubType")?.value || "";
  let manualType = $("bManualType")?.value.trim() || "";
  let dewey = $("bDewey")?.value.trim() || "";


  if (!type) {

    alert("Lütfen kitap türünü seçin.");
    return;
  }


  if (type === "__manual__") {

    if (!manualType) {

      alert("Lütfen tür adını yazın.");
      return;
    }

    if (!dewey) {

      alert("Manuel tür için Dewey kodunu girin.");
      return;
    }
  }


  

  const finalType =
    type === "__manual__"
      ? manualType
      : type;


  const qr = createBookCode(
    type,
    subtype,
    manualType
  );


  /* Ek güvenlik: aynı kod varsa tekrar üret */

  if (books.some(book => book.qr === qr)) {

    alert("Kod çakışması oluştu. Lütfen tekrar deneyin.");
    return;
  }


 const { error } = await db
  .from("kitaplar")
  .insert({
    kitap_adi: $("bName").value.trim(),
    yazar: $("bAuthor").value.trim(),
    tur: finalType,
    alt_tur: subtype || null,
    dewey: dewey || null,
    dolap: $("bCab").value.trim() || null,
    raf: $("bShelf").value.trim() || null,
    sira: $("bOrder").value.trim() || null
  });

if (error) {
  console.error("Kitap kaydedilemedi:", error);
  alert("Supabase hatası: " + error.message);
  return;
} 

  event.target.reset();

  closeForm("bookForm");

  await loadBooks();
}


/* =========================================================
   ÖĞRENCİ
   ========================================================= */

async function saveStudent(event) {
  event.preventDefault();

  const { error } = await db
    .from("ogrenciler")
    .insert({
      ad_soyad: $("sName").value.trim(),
      sinif: $("sClass").value.trim(),
      sube: $("sBranch").value.trim(),
      okul_no: $("sNo").value.trim()
    });

  if (error) {
    console.error("Öğrenci kaydedilemedi:", error);
    alert("Öğrenci kaydedilirken bir hata oluştu.");
    return;
  }

  event.target.reset();
  closeForm("studentForm");

  await loadStudents();
}


/* =========================================================
   ÖDÜNÇ
   ========================================================= */

async function lendBook() {

  const book = +$("loanBook").value;
  const student = +$("loanStudent").value;
  const due = $("dueDate").value;

  if (!book || !student || !due) {
    alert("Kitap, öğrenci ve son teslim tarihini seç.");
    return;
  }

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  const { error } = await db
    .from("odunc_islemleri")
    .insert({
      kitap_id: book,
      ogrenci_id: student,
      odunc_tarihi: today,
      son_teslim_tarihi: due,
      iade_tarihi: null
    });

  if (error) {
    console.error("Ödünç işlemi kaydedilemedi:", error);
    alert("Supabase hatası: " + error.message);
    return;
  }

  alert("Kitap başarıyla ödünç verildi.");
}


/* =========================================================
   İADE
   ========================================================= */

function returnBook(id) {

  const loan =
    loans.find(item => item.id === id);

  if (loan) {

    loan.returned =
      new Date()
        .toISOString()
        .slice(0, 10);

    save();
  }
}


/* =========================================================
   SİLME
   ========================================================= */

function delBook(id) {

  if (confirm("Bu kitap silinsin mi?")) {

    books =
      books.filter(book => book.id !== id);

    save();
  }
}


function delStudent(id) {

  if (confirm("Bu öğrenci silinsin mi?")) {

    students =
      students.filter(student => student.id !== id);

    save();
  }
}

async function editBook(id) {
  const book = books.find(book => book.id === id);

  if (!book) {
    alert("Kitap bulunamadı.");
    return;
  }

  document.getElementById("editBookId").value = book.id;
  document.getElementById("editBookName").value = book.name || "";
  document.getElementById("editBookAuthor").value = book.author || "";
  document.getElementById("editBookType").value = book.type || "";
  document.getElementById("editBookSubType").value = book.subtype || "";
  document.getElementById("editBookDewey").value = book.dewey || "";
  document.getElementById("editBookQr").value = book.qr || "";
  document.getElementById("editBookCab").value = book.cab || "";
  document.getElementById("editBookShelf").value = book.shelf || "";
  document.getElementById("editBookOrder").value = book.order || "";

  document.getElementById("editBookForm").showModal();
}

async function saveEditedBook(event) {
  event.preventDefault();

  const id = document.getElementById("editBookId").value;

  const name = document.getElementById("editBookName").value.trim();
  const author = document.getElementById("editBookAuthor").value.trim();
  const type = document.getElementById("editBookType").value.trim();
  const dewey = document.getElementById("editBookDewey").value.trim();
  const cab = document.getElementById("editBookCab").value.trim();
  const shelf = document.getElementById("editBookShelf").value.trim();
  const order = document.getElementById("editBookOrder").value.trim();

  if (!name || !author) {
    alert("Kitap adı ve yazar boş bırakılamaz.");
    return;
  }

  const { error } = await db
    .from("kitaplar")
    .update({
      kitap_adi: name,
      yazar: author,
      tur: type,
      dewey: dewey,
      dolap: cab,
      raf: shelf,
      sira: order
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Kitap güncellenirken bir hata oluştu.");
    return;
  }

  document.getElementById("editBookForm").close();

  await loadBooks();

  alert("Kitap bilgileri güncellendi.");
}

/* =========================================================
   EKRANI YENİLE
   ========================================================= */

function render() {

  const active =
    loans.filter(loan => !loan.returned);

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const late =
    active.filter(
      loan => loan.due < today
    );


  $("sKitap").textContent =
    books.length;

  $("sOgr").textContent =
    students.length;

  $("sOdunc").textContent =
    active.length;

  $("sGec").textContent =
    late.length;


  /* =====================================================
     KİTAP LİSTESİ
     ===================================================== */

  $("bookList").innerHTML =

    books.map(book => {

      const subtypeText =
        book.subtype
          ? ` · ${book.subtype}`
          : "";

      const deweyText =
        book.dewey
          ? ` · Dewey: ${book.dewey}`
          : "";

      return `

        <div class="item">

          <div>

            <b>${book.name}</b>

            <small>
              ${book.author}
              · ${book.type || "-"}
              ${subtypeText}
              ${deweyText}
              · ${book.qr}
              · Dolap ${book.cab || "-"}
              / Raf ${book.shelf || "-"}
              / Sıra ${book.order || "-"}
            </small>

          </div>

          <div class="buttons">

            <button
              onclick="alert('Kitap Kodu: ${book.qr}')"
            >
              QR Kod
            </button>

<button
  onclick="editBook(${book.id})"
>
  Düzenle
</button>

            <button
              class="muted"
              onclick="delBook(${book.id})"
            >
              Sil
            </button>

          </div>

        </div>

      `;

    }).join("") ||

    '<div class="box">Henüz kitap eklenmedi.</div>';


  /* =====================================================
     ÖĞRENCİ LİSTESİ
     ===================================================== */

  $("studentList").innerHTML =

    students.map(student => {

      const count =
        active.filter(
          loan => loan.student === student.id
        ).length;

      return `

        <div class="item">

          <div>

            <b>${student.name}</b>

            <small>
              ${student.cls}/${student.branch}
              · No: ${student.no}
            </small>

          </div>

          <div class="buttons">

            <button
              onclick="alert('${count} ödünç kitap var.')"
            >
              Ödünç Kitap Bilgisi
            </button>

            <button
              class="muted"
              onclick="delStudent(${student.id})"
            >
              Sil
            </button>

          </div>

        </div>

      `;

    }).join("") ||

    '<div class="box">Henüz öğrenci eklenmedi.</div>';


  /* =====================================================
     ÖDÜNÇ SEÇENEKLERİ
     ===================================================== */

  const available =

    books.filter(book =>

      !active.some(
        loan => loan.book === book.id
      )
    );


  $("loanBook").innerHTML =

    '<option value="">Kitap seçin</option>' +

    available.map(book =>

      `<option value="${book.id}">
        ${book.name} (${book.qr})
      </option>`

    ).join("");


  $("loanStudent").innerHTML =

    '<option value="">Öğrenci seçin</option>' +

    students.map(student =>

      `<option value="${student.id}">
        ${student.name} - ${student.no}
      </option>`

    ).join("");


  /* =====================================================
     AKTİF ÖDÜNÇLER
     ===================================================== */

  const loanHTML =

    active.map(loan => {

      const book =
        books.find(
          item => item.id === loan.book
        );

      const student =
        students.find(
          item => item.id === loan.student
        );

      return `

        <div class="item">

          <div>

            <b>${book?.name || "Kitap"}</b>

            <small>
              ${student?.name || "Öğrenci"}
              · Ödünç: ${loan.start}
              · Son teslim: ${loan.due}
            </small>

          </div>

          <button
            onclick="returnBook(${loan.id})"
          >
            Geri Al
          </button>

        </div>

      `;

    }).join("");


  $("loanList").innerHTML =
    loanHTML;

  $("sonIslem").innerHTML =
    loanHTML || "Henüz işlem yok.";


  /* =====================================================
     GECİKENLER
     ===================================================== */

  $("lateList").innerHTML =

    late.map(loan => {

      const book =
        books.find(
          item => item.id === loan.book
        );

      const student =
        students.find(
          item => item.id === loan.student
        );

      const days =
        Math.ceil(
          (
            new Date(today) -
            new Date(loan.due)
          ) / 86400000
        );

      return `

        <div class="item">

          <div>

            <b>${book?.name || "Kitap"}</b>

            <small>
              ${student?.name || "Öğrenci"}
              · ${loan.due}
              · ${days} gün gecikti
            </small>

          </div>

          <button
            onclick="returnBook(${loan.id})"
          >
            Geri Al
          </button>

        </div>

      `;

    }).join("") ||

    '<div class="box">Geciken kitap yok. 🎉</div>';

}


/* =========================================================
   ARAMA
   ========================================================= */

$("bookSearch").oninput = event => {

  const query =
    event.target.value
      .toLocaleLowerCase("tr-TR");

  document
    .querySelectorAll("#bookList .item")
    .forEach(item => {

      item.style.display =
        item.innerText
          .toLocaleLowerCase("tr-TR")
          .includes(query)
          ? "flex"
          : "none";
    });
};


$("studentSearch").oninput = event => {

  const query =
    event.target.value
      .toLocaleLowerCase("tr-TR");

  document
    .querySelectorAll("#studentList .item")
    .forEach(item => {

      item.style.display =
        item.innerText
          .toLocaleLowerCase("tr-TR")
          .includes(query)
          ? "flex"
          : "none";
    });
};


/* =========================================================
   BAŞLAT
   ========================================================= */

async function loadLoans() {

  const { data, error } = await db
    .from("odunc_islemleri")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Ödünç işlemleri yüklenemedi:", error);
    alert("Ödünç işlemleri yüklenirken bir hata oluştu.");
    return;
  }

  loans = (data || []).map(loan => ({
    id: loan.id,
    book: loan.kitap_id,
    student: loan.ogrenci_id,
    start: loan.odunc_tarihi,
    due: loan.son_teslim_tarihi,
    returned: loan.iade_tarihi
  }));

  render();
}

loadBooks();
loadStudents();
loadLoans();
