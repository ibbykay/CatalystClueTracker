//Enable "Add App" button for Alt1 Browser.
A1lib.identifyApp("appconfig.json");

const appColor = A1lib.mixColor(27, 254, 0);

// Set Chat reader
let reader = new Chatbox.default();
reader.readargs = {
  colors: [
    A1lib.mixColor(27, 254, 0), //Catalyst text color
  ],
  backwards: true,
};

//Setup localStorage variable.
if (!localStorage.cataData) {
  localStorage.setItem("cataData", JSON.stringify([]))
}
let saveData = JSON.parse(localStorage.cataData);

//Find all visible chatboxes on screen
$(".itemList").append("<li class='list-group-item'>Searching for chatboxes</li>");
reader.find();
reader.read();
let findChat = setInterval(function () {
  if (reader.pos === null)
    reader.find();
  else {
    clearInterval(findChat);
    reader.pos.boxes.map((box, i) => {
      $(".chat").append(`<option value=${i}>Chat ${i}</option>`);
    });

    if (localStorage.cataChat) {
      reader.pos.mainbox = reader.pos.boxes[localStorage.cataChat];
    } else {
      //If multiple boxes are found, this will select the first, which should be the top-most chat box on the screen.
      reader.pos.mainbox = reader.pos.boxes[0];
    }
    showSelectedChat(reader.pos);
    //build table from saved data, start tracking.
    showItems();
    setInterval(function () {
      readChatbox();
    }, 600);
  }
}, 1000);

function showSelectedChat(chat) {
  //Attempt to show a temporary rectangle around the chatbox.  skip if overlay is not enabled.
  try {
    alt1.overLayRect(
      appColor,
      chat.mainbox.rect.x,
      chat.mainbox.rect.y,
      chat.mainbox.rect.width,
      chat.mainbox.rect.height,
      2000,
      5
    );
  } catch { }
}

//Reading and parsing info from the chatbox.
function readChatbox() {
  var opts = reader.read() || [];
  var chat = "";
  
  
  for (a in opts) {
    chat += opts[a].text + " ";
  }

  if (chat.indexOf("The catalyst of alteration contained :") > -1) {
    let getItem = {
      item: chat.match(/\d+ x [A-Za-z\s-'()1-4]+/)[0].trim(),
      time: new Date()
    };
	
    console.log(getItem);
    saveData.push(getItem);
    localStorage.setItem("cataData", JSON.stringify(saveData));
    checkAnnounce(getItem);
    showItems();
  }
}

function showItems() {
  $(".itemList").empty();
  if (localStorage.getItem("cataTotal") === "total") {
    $(".itemList").append(`<li class="list-group-item header" data-show="history" title="Click to show History">Total Clues Collected</li>`);
    let total = getTotal();
    Object.keys(total).sort().forEach(item => $(".itemList").append(`<li class="list-group-item">${item}: ${total[item]}</li>`))
  } else {
    $(".itemList").append(`<li class="list-group-item header" data-show="total" title="Click to show Totals">Catalyst Clue History</li>`);
    saveData.slice().reverse().map(item => {
      $(".itemList").append(`<li class="list-group-item" title="${new Date(item.time).toLocaleString()}">${item.item}</li>`)
    })
  }
 }

function checkAnnounce(getItem) {
  if (localStorage.cataAnnounce) {
    fetch(localStorage.getItem("cataAnnounce"),
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: "Ibby's cata Tracker",
          content: `${new Date(getItem.time).toLocaleString()}: Received - ${getItem.item}`
        })
      })
  }
}

//Function to determine the total of all items recorded.
function getTotal() {
  let total = {};
  saveData.forEach(item => {
    data = item.item.split(" x ");
    total[data[1]] = parseInt(total[data[1]]) + parseInt(data[0]) || parseInt(data[0])
  })
  return total;
}

$(function () {

  $(".chat").change(function () {
    reader.pos.mainbox = reader.pos.boxes[$(this).val()];
    showSelectedChat(reader.pos);
    localStorage.setItem("cataChat", $(this).val());
    $(this).val("");
  });

  $(".export").click(function () {
    var str, fileName;
    //If totals is checked, export totals
    if (localStorage.getItem("cataTotal") === "total") {
      str = "Qty,Item\n";
      let total = getTotal();
      Object.keys(total).sort().forEach(item => str = `${str}${total[item]},${item}\n`);
      fileName = "cataTotalExport.csv";

      //Otherwise, export list by item and time received.
    } else {
      str = "Item,Time\n"; // column headers
      saveData.forEach((item) => {
        str = `${str}${item.item},${new Date(item.time).toLocaleString()}\n`;
      });
      fileName = "cataHistoryExport.csv"
    }
    var blob = new Blob([str], { type: "text/csv;charset=utf-8;" });
    if (navigator.msSaveBlob) {
      // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      var link = document.createElement("a");
      if (link.download !== undefined) {
        // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  });

  $(".clear").click(function () {
    localStorage.removeItem("cataData");
    localStorage.removeItem("cataChat");
    localStorage.removeItem("cataTotal");
    location.reload();
  })

  $(document).on("click", ".header", function () {
    localStorage.setItem("cataTotal", $(this).data("show")); showItems()
  })
});
