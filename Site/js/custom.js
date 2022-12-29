

/*-------------------------------------------------------------------------------
  PRE LOADER
-------------------------------------------------------------------------------*/

$(window).load(function () {
  $('.preloader').fadeOut(1000); // set duration in brackets    
});

/*-------------------------------------------------------------------------------
  LOL
-------------------------------------------------------------------------------*/

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

loadMore = function () {
  var table = document.getElementById("matchsList");
  var rowCount = table.rows.length;
  table.deleteRow(rowCount - 1);

  id = table.rows[rowCount - 2].id;

  httpGetAsync("http://albert.blaisot.org:8080/lol/matchs?last=" + id, function (response) {
    var table = document.getElementById("matchsListbody");
    table.innerHTML += response;
    table.innerHTML += "<tr class=\"see_more_ajax_button_row\"><td colspan=\"10\" class=\"text-center\"><button type=\"button\" class=\"see_more\" onclick=\"loadMore()\">See more</button></td></tr>";
  });
  //var row = table.insertRow(table.rows.length - 1);
  //var cell = row.insertCell(0);
  //cell.innerHTML = "Test2";
}

initial_load = function () {
  httpGetAsync("http://albert.blaisot.org:8080/lol/matchs", function (response) {
    console.log(response);
    var table = document.getElementById("matchsListbody");
    table.innerHTML += response;
    table.innerHTML += "<tr class=\"see_more_ajax_button_row\"><td colspan=\"10\" class=\"text-center\"><button type=\"button\" class=\"see_more\" onclick=\"loadMore()\">See more</button></td></tr>";
  });
}