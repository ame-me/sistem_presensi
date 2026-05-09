const fs = require('fs');

const classes = [
    'VII A', 'VII B', 'VII C', 'VII D', 'VII E',
    'VIII A', 'VIII B', 'VIII C', 'VIII D', 'VIII E',
    'IX A', 'IX B', 'IX C', 'IX D', 'IX E'
];

const names = [
    "Ahmad", "Siti", "Budi", "Dewi", "Eko", "Farida", "Gilang", "Hana", "Iwan", "Jihan", 
    "Kevin", "Larasati", "Muhammad", "Nadia", "Oka", "Pratama", "Queen", "Rizky", "Salsabila", "Taufik",
    "Ulya", "Vino", "Wanda", "Xavier", "Yulia", "Zaki", "Andi", "Bella", "Candra", "Dina"
];

const surnames = [
    "Santoso", "Lestari", "Prasetyo", "Utami", "Ramadhan", "Pertiwi", "Setiawan", "Fahira", "Sanjaya", "Putri",
    "Saputra", "Safira", "Mahendra", "Wulandari", "Hidayat", "Kusuma", "Aulia", "Nugroho", "Sari", "Purnama"
];

const cities = ["Surabaya", "Sidoarjo", "Gresik", "Malang", "Mojokerto"];
const jobs = ["Wiraswasta", "PNS", "Buruh", "Pedagang", "TNI", "Polisi", "Guru", "Karyawan"];

let sql = "USE presensipander_db;\n\n";
sql += "-- Clear existing students for a fresh start or add to it?\n";
sql += "-- To avoid duplicates we'll delete the ones we just added if necessary, or start from a high NoInduk.\n";
sql += "DELETE FROM siswa;\n\n";

let studentCounter = 1001;
let nisnCounter = 1101122334;

classes.forEach(className => {
    sql += `-- Data dummy Siswa untuk Kelas ${className}\n`;
    sql += "INSERT INTO siswa (noInduk, nisn, name, tglLahir, kota, alamat, namaAyah, pekerjaanAyah, namaIbu, pekerjaanIbu, cls, parent, wa, status) VALUES\n";
    
    let studentRows = [];
    for (let i = 0; i < 15; i++) {
        const firstName = names[Math.floor(Math.random() * names.length)];
        const lastName = surnames[Math.floor(Math.random() * surnames.length)];
        const fullName = `${firstName} ${lastName}`;
        const bday = `201${Math.floor(Math.random() * 2) + 0}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const alamat = `Jl. Contoh No. ${Math.floor(Math.random() * 100) + 1}`;
        const ayah = `Ayah ${lastName}`;
        const ibu = `Ibu ${lastName}`;
        const jobA = jobs[Math.floor(Math.random() * jobs.length)];
        const jobI = jobs[Math.floor(Math.random() * jobs.length)];
        const wa = `081234567${studentCounter}`;
        
        studentRows.push(`('${studentCounter}', '${nisnCounter}', '${fullName}', '${bday}', '${city}', '${alamat}', '${ayah}', '${jobA}', '${ibu}', '${jobI}', '${className}', '${ayah}', '${wa}', 'ok')`);
        
        studentCounter++;
        nisnCounter++;
    }
    
    sql += studentRows.join(",\n") + ";\n\n";
    sql += `UPDATE kelas SET count = 15 WHERE name = '${className}';\n\n`;
});

fs.writeFileSync('all_dummy_students.sql', sql);
console.log("SQL script generated: all_dummy_students.sql");
