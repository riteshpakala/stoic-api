// import { handleErrors, backendUrl } from "./utils.js";
//
// window.addEventListener("DOMContentLoaded", async (e) => {
//   let pathName = window.location.pathname.split("/")[2];
//
//   const res = await fetch(`${backendUrl}/stocks/${pathName}`);
//   const data = await res.json();
//   const {
//     id,
//     name,
//     symbol,
//     description,
//     ceo,
//     employees,
//     headquarters,
//     founded,
//     marketCap,
//     priceEarningRatio,
//     dividendYield,
//     averageVolume,
//   } = data.stock;
//
//   const modMarketCap = `${marketCap / 1000000000}B`;
//   const modAverageVolume = `${averageVolume / 1000000}M`;
//
//   document.querySelector(".company__title").innerHTML = name;
//
//   const chartInfoRes = await fetch(`${backendUrl}/stocks/chartinfo/${symbol}`);
//   const chartData = await chartInfoRes.json();
//   const parsedData = chartData.data
//     .map((element) => {
//       element.date = new Date(element.date);
//       return element;
//     })
//     .filter((element) => {
//       if (element.value) return true;
//     });
//   var initVal = (
//     Math.round(parsedData[parsedData.length - 1].value * 100) / 100
//   ).toFixed(2);
//   document.querySelector(".company__buy-price").innerHTML = `\$${initVal}`;
//
//   var defaultVal = parsedData[0].value; //*** */
//   var initDiff = initVal - defaultVal; //*** */
//   var initPercentage = (initVal * 100) / defaultVal - 100;
//   document.querySelector(".company__price").innerHTML = `\$${initVal}`;
//   document.querySelector(
//     ".company__price-change"
//   ).innerHTML = `\$${initDiff.toFixed(2)}(${initPercentage.toFixed(2)}%)`; //**** */
//   if (parsedData[0].value > parsedData[parsedData.length - 1].value) {
//     drawChartRed(parsedData);
//   } else {
//     drawChartGreen(parsedData);
//   }
//
//   const watchListRes = await fetch(`${backendUrl}/watchlists/${userId}`);
//   const watchListData = await watchListRes.json();
//
//   let checkIfInWatchlist = false;
//   watchListData.watchlists.forEach((company) => {
//     if (company.Company.symbol === symbol) {
//       checkIfInWatchlist = true;
//     }
//   });
//
//   if (checkIfInWatchlist) {
//     document.querySelector(".company__remove-watch").innerHTML =
//       "Remove from Watchlist";
//   } else {
//     document.querySelector(".company__remove-watch").innerHTML =
//       "Add to Watchlist";
//   }
//
//   const addRemoveButton = document.querySelector(".company__remove-watch");
//   addRemoveButton.addEventListener("click", async (event) => {
//     if (addRemoveButton.innerHTML === "Remove from Watchlist") {
//       await fetch(`${backendUrl}/watchlists/${id}`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId }),
//       });
//       window.location.href = "/portfolio";
//     } else {
//       await fetch(`${backendUrl}/watchlists/${userId}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ symbol }),
//       });
//       window.location.href = "/portfolio";
//     }
//   });
// });
