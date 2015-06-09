var i, len;
var upperCaseStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var upperCaseObj = {};
len = upperCaseStr.length;
for (i = 0; i < len; i += 1) {
  upperCaseObj[upperCaseStr[i]] = true;
}

var wordsObj = {};
var req = new XMLHttpRequest();
req.open("GET", "cmudict_words.json", true);
req.onload = function (e) {
  if (req.readyState === 4) {
    if (req.status === 200) {
      var wordsArr = JSON.parse(req.responseText);
      len = wordsArr.length;
      for (i = 0; i < len; i += 1) {
        wordsObj[wordsArr[i]] = true;
      }
    } else {
      console.error(req.statusText);
    }
  }
};
req.onerror = function (e) {
  console.error(req.statusText);
};
req.send(null);

function isEnglish(text, threshold) {
  var i, len, character;
  len = text.length;
  var filteredText = "";
  for (i = 0; i < len; i += 1) {
    character = text[i];
    if (upperCaseObj[character] || character === " ") {
      filteredText += character;
    }
  }
  var splitText = filteredText.split(" ");
  len = splitText.length;
  if (len === 0) {
    return false;
  }
  var count = 0;
  for (i = 0; i < len; i += 1) {
    if (wordsObj[splitText[i]]) {
      count += 1;
    }
  }
  var percentage = 100 * count / len;
  return percentage >= threshold;
}

function convert(message, key, conversion) {
  var i, len, brute, maxTries;
  var upperMessage = message.toUpperCase();
  len = upperMessage.length;
  if (key === "brute") {
    if (conversion === "encrypt") {
      return ["Use 'brute force' with 'decrypt'"];
    }
    brute = true;
    maxTries = 25;
    key = 1;
  } else {
    brute = false;
    maxTries = 1;
    key = parseInt(key, 10);
  }
  var currentTry = 0;
  var possibleMessages = [];
  var newMessage, newChar, idx;
  while (currentTry < maxTries) {
    newMessage = "";
    for (i = 0; i < len; i += 1) {
      newChar = upperMessage[i];
      if (upperCaseObj[newChar]) {
        idx = upperCaseStr.indexOf(newChar);
        if (conversion === "encrypt") {
          idx += key;
        } else {
          idx -= key;
        }
        idx = (idx + 26) % 26;
        newChar = upperCaseStr[idx];
      }
      newMessage += newChar;
    }
    possibleMessages.push(newMessage);
    currentTry += 1;
    key += 1;
  }
  if (!brute) {
    return possibleMessages;
  } else {
    var text;
    var threshold = 75;
    var filteredPossible;
    len = possibleMessages.length;
    while (threshold > 0) {
      filteredPossible = [];
      for (i = 0; i < len; i += 1) {
        text = possibleMessages[i];
        if (isEnglish(text, threshold)) {
          filteredPossible.push(text);
        }
      }
      if (filteredPossible.length > 0) {
        break;
      }
      threshold -= 25;
    }
    if (filteredPossible.length === 0) {
      filteredPossible = possibleMessages;
    }
    if (isEnglish(upperMessage, 75)) {
      filteredPossible.push("Are you sure you didn't mean to encrypt your message?");
    }
    return filteredPossible;
  }
}

var app = angular.module("app", []);
app.config(["$locationProvider", function ($locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}]);
app.controller("AppController", ["$location", function ($location, $sanitize) {
  var vm = this;
  var query = $location.search();
  vm.message = "";
  vm.key = "brute";
  vm.conversion = "decrypt";
  vm.results = [];
  vm.permalink = window.location.href;
  vm.convert = function () {
    vm.results = convert(vm.message, vm.key, vm.conversion);
    vm.permalink = window.location.href.split("?")[0] + "?message=" +
                   encodeURIComponent(vm.message) + "&key=" + vm.key +
                   "&conversion=" + vm.conversion;
  };
  if (Object.keys(query).length > 0) {
    if (query.message) {
      vm.message = query.message;
    }
    if (query.key) {
      vm.key = query.key;
    }
    if (query.conversion) {
      vm.conversion = query.conversion;
    }
    vm.convert();
  }
}]);
// access in console: angular.element($("#app")).scope().vm
