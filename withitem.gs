var botToken = "***bottoken***"; 
var ssId = "***spreadsheetid";
var webAppUrl = "***script url***";
var telegramUrl = "https://api.telegram.org/bot" + botToken;
var docUrl = "*** file url ***";

function filter(tanggal, barang){
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheets()[0];
  var range = sheet.getDataRange();
  var filter = range.getFilter() || range.createFilter();
  var bulan = tanggal;
  var awal = new Date(bulan);
  var akhir = new Date(awal.getFullYear(), awal.getMonth(), awal.getDay());
  akhir.setMonth(akhir.getMonth()+2);
  const criteria = SpreadsheetApp.newFilterCriteria().whenTextEndsWith(bulan);
  const add_filter1 =  filter.setColumnFilterCriteria(1,criteria);
  const r = sheet.getDataRange();
  const values = r.getValues();
  const  new_sheet = ss.insertSheet();
  new_sheet.setName("Coba");

  r.copyTo(new_sheet.getRange(1,1));
  
  var new_values = new_sheet.getDataRange().getValues();
  
  total = 0;
  totalBarang = 0;
  new_values.forEach(function(obj, index){
    if(index > 0){
      if(barang == obj[4].toLowerCase().split(" ").join("") || barang == ""){
        total += parseFloat(obj[6]);
        totalBarang += parseFloat(obj[5]);
      }
    }
  });
  ss.deleteSheet(new_sheet);

  filter.remove();
  return [total, totalBarang];
}


/* REST HELPERS */
function getMe() {
  var url = telegramUrl + "/getMe";
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendText(id,text) {
  var url = telegramUrl + "/sendMessage?chat_id=" + id + "&text=" + encodeURI(text);
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function doGet(e) {
  return HtmlService.createHtmlOutput("Hey there! Send POST request instead!");
}

function doPost(e) {
  try {
    // this is where telegram works
    const timeZone = 'Asia/Jakarta';
    var data = JSON.parse(e.postData.contents);
    var text = data.message.text;
    var id = data.message.chat.id;
    var name = data.message.from.first_name + " " + data.message.from.last_name;
    var answer = "Hi " + name;
    if (text.toLowerCase().startsWith("/in")){
      text = text.replace("/IN", "/in");
      var textData = text.split("/in ");
      if(textData.length == 1) {
        textData = text.split("/in");
      }
      textData.shift();
      var inputDataRows = textData.join("").split("\n");
      var now = new Date();
      var tanggal = Utilities.formatDate(now, timeZone, 'dd/MM/yyyy');
      var waktu = Utilities.formatDate(now, timeZone, 'HH:mm:ss');
      if(textData.join("").trim() != ""){
        var insertCount = 0;
        inputDataRows.forEach(function(item){
          var inputData = item.split(";");
          if(inputData.length > 1){
            SpreadsheetApp.openById(ssId).getSheets()[0].appendRow(["'"+tanggal,waktu,name, ...inputData]);
            insertCount++;
          }
        });
        sendText(id, insertCount+" data berhasil diinput");
      } else {
        sendText(id, "Format tidak valid");
        var msg = answer+"\nUntuk memulai memasukkan data ketik /insert diikuti data yang ingin disimpan. setiap kolom data dipisahkan dengan titik koma (;)\nContoh: /insert data1;data2;data3\nData dapat dilihat di "+encodeURI(docUrl);
        sendText(id, msg);
      }
      
//      sendText(id, "Data anda adalah \n"+inputData.join("\n"));
    } else if (text.toLowerCase().startsWith("/total")){
      var textData = text.split("/total");
      textData.shift();
      var inputData = textData.join("").trim().split(" ");
      Logger.log(inputData);
      var tgl = inputData[0];
//      Logger.log(tgl);
      inputData.shift();
      var brg = inputData.join("").toLowerCase().trim();
//      Logger.log(brg);
//      sendText(id, brg);
      var total = filter(tgl, brg);
      var rupiahFormat = Intl.NumberFormat('id-ID');
      var msg = "total penjualan adalah : Rp"+rupiahFormat.format(total[0]) + "\n" + "jumlah barang adalah : "+total[1];
      sendText(id, msg);
    } else if (text.toLowerCase().startsWith("/coba")){
      var textData = text.split("/coba ");
      textData.shift();
      var inputData = textData.join("").split("\n");
      inputData.forEach(function(item){
        sendText(id, item);
      });
    } else {
      var msg = answer+"\nUntuk memulai memasukkan data ketik /insert diikuti data yang ingin disimpan, setiap kolom data dipisahkan dengan titik koma (;)\nContoh: /insert data1;data2;data3\nData dapat dilihat di "+encodeURI(docUrl);
      sendText(id, msg);
    }
  } catch(err) {
    Logger.log(err);
    sendText(231755772, JSON.stringify(err,null,4));
  }
}
