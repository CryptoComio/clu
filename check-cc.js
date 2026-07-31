fetch("https://club-champions.eu/team?clubId=7072551&platform=ps5")
  .then(r => r.text())
  .then(t => {
     console.log(t.substring(0, 500));
  });
