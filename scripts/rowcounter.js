import cookie from './jquery-cookie.js';

/**
 * @typedef {{
 *   name: string;
 *   row: number;
 *   goal: number;
 *   freq: number;
 *   freqStart: number;
 *   prevRowTime: number;
 * }} ProjectSettings
 *
 * @typedef {'dark' | 'light'} Theme
 *
 * @typedef {{
 *  profile: {
 *    id: string;
 *    currentProject: boolean;
 *  },
 *  settings: {
 *    theme: Theme;
 *    key: typeof keyMap[keyof keyMap]
 *  },
 *  projects: {
 *    [key: string]: ProjectSettings;
 *  }
 * }} UserData;
 */

const keyMap = {
  backspace: 8,
  tab: 9,
  enter: 13,
  shift: 16,
  ctrl: 17,
  alt: 18,
  pause: 19,
  capslock: 20,
  escape: 27,
  space: 32,
  pageup: 33,
  pagedown: 34,
  end: 35,
  home: 36,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  insert: 45,
  delete: 46,
  0: 48,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  a: 65,
  b: 66,
  c: 67,
  d: 68,
  e: 69,
  f: 70,
  g: 71,
  h: 72,
  i: 73,
  j: 74,
  k: 75,
  l: 76,
  m: 77,
  n: 78,
  o: 79,
  p: 80,
  q: 81,
  r: 82,
  s: 83,
  t: 84,
  u: 85,
  v: 86,
  w: 87,
  x: 88,
  y: 89,
  z: 90,
  leftwin: 91,
  rightwin: 92,
  select: 93,
  num0: 96,
  num1: 97,
  num2: 98,
  num3: 99,
  num4: 100,
  num5: 101,
  num6: 102,
  num7: 103,
  num8: 104,
  num9: 105,
  multiply: 106,
  add: 107,
  subtract: 109,
  decimal: 110,
  divide: 111,
  f1: 112,
  f2: 113,
  f3: 114,
  f4: 115,
  f5: 116,
  f6: 117,
  f7: 118,
  f8: 119,
  f9: 120,
  f10: 121,
  f11: 122,
  f12: 123,
  numlk: 144,
  scrolllk: 145,
  semicolon: 186,
  equals: 187,
  comma: 188,
  dash: 189,
  period: 190,
  slash: 191,
  backtick: 192,
  lbracket: 219,
  backslash: 220,
  rbracket: 221,
  apostrophe: 222,
};

/**
 * @type {keyof keyMap}
 */
const defaultKeyCode = 'space';

/**
 * @type {Readonly<UserData>}
 */
const userDataTemplate = {
  profile: {
    id: '',
    currentProject: false,
  },
  settings: {
    theme: 'dark',
    key: keyMap[defaultKeyCode],
  },
  projects: {},
};

const newProjectTemplate = {
  name: 'New Project',
  row: 0,
  goal: 100,
  freq: 0,
  freqStart: 0,
  prevRowTime: 0,
};

/**
 * @type UserData
 */
let userData;

$(document).ready(function () {
  initializeUserData();
  setTheme();
  setKey();
  showProjectsPage();
  $('#tab-projects').show();

  $('.tabs li a').click(function (e) {
    e.preventDefault();
    const id = $(this).attr('id');
    if (id == null) {
      console.error('id null');
      return;
    }
    const idParts = id.split('-');
    const tab = `#tab-${idParts[1]}`;
    $('.tab').hide();
    $(tab).show();
    $('.tabs li a').removeClass('active');
    $(this).addClass('active');
  });

  $('#newProject').click(function () {
    createProject();
  });
  $('#projects').on('click', 'td a', function (e) {
    e.preventDefault();
    const projectID = $(this).parents('tr').first().data('project');
    if ($(this).hasClass('openProject')) {
      $('#cancelChanges').hide();
      openProject(projectID);
      runProject();
    } else if ($(this).hasClass('deleteProject')) {
      deleteProject(projectID);
    }
  });
  $('#projectAdvSettingsGrabber').click(function () {
    $('#projectAdvSettings').toggle();
  });
  $('#startProject').click(function () {
    storeProjectSettings();
    $('#cancelChanges').show();
    runProject();
  });
  $('#cancelChanges').click(function () {
    runProject();
  });
  $('#changeProjectSettings').click(function () {
    const projectIDString = /** @type string */ ($('#projectID').val());
    openProject(projectIDString);
  });
  $('#switchProject, #switchProject2').click(function () {
    showProjectsPage();
  });
});

/**
 * @returns {void}
 */
function initializeUserData() {
  /** @type UserData */
  userData = cookie.read('knitting-data');
  if (userData == null) {
    userData = userDataTemplate;
    doUpgrade();
    saveUserData();
  }
}

/**
 * @returns {void}
 */
function saveUserData() {
  cookie.write('knitting-data', userData, { expires: 30 });
}

function doUpgrade() {
  /**
   * @type {{
   *  count: number;
   *  goal: number;
   *  repeatFreq: number;
   *  lastRow: number;
   *  key: typeof keyMap[keyof keyMap];
   * }}
   */
  const settings = cookie.read('knitting-settings');
  if (typeof settings != 'undefined' && settings) {
    const time = new Date().getTime();
    userData.projects[time] = {
      name: 'Current Project',
      row: settings.count,
      goal: settings.goal,
      freq: settings.repeatFreq,
      freqStart: 0,
      prevRowTime: settings.lastRow,
    };
    userData.settings.key = settings.key;
  }
}

function setTheme() {
  const theme = userData.settings.theme;
  if (typeof theme != 'undefined' && theme === 'light') {
    $('#themeswitch').removeAttr('checked');
    $('#theme').attr('href', 'styles/theme-light.css');
  }
  $('#themeswitch').change(function () {
    /** @type Theme */
    let theme;
    if ($(this).is(':checked')) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
    setTimeout(function () {
      $('#theme').attr('href', `styles/theme-${theme}.css`);
    }, 300);
    userData.settings.theme = theme;
    saveUserData();
  });
}

function setKey() {
  const key = userData.settings.key;
  $('#keyCode').html('');
  $.each(keyMap, function (name, code) {
    const $element = $('<option></option>').attr('value', code).text(name);
    if (code === key) {
      $element.attr('selected', 1);
    }
    $('#keyCode').append($element);
  });
  $('#keyCode').on('change', function () {
    userData.settings.key = Number($(this).val());
    saveUserData();
  });
}

function showProjectsPage() {
  stopListening();
  $('#projects').html('');
  let i = 0;
  for (const projectID in userData.projects) {
    if (projectID in userData.projects) {
      const project = userData.projects[projectID];
      const projectEntry = $('<tr></tr>').data('project', projectID);
      let percent = '';
      if (project.goal > 0) {
        percent = `${Math.floor((project.row / project.goal) * 100)}%`;
      }
      const projectName = $('<td></td>').html(`<a href='' class='openProject'>${project.name}</a>`);
      const projectPercent = $('<td></td>').html(`<span>${percent}</span>`);
      const projectStart = $('<td></td>').html(`<span>${formatTimestamp(projectID, true)}</span>`);
      const projectDelete = $('<td></td>').html(
        "<a href='' class='deleteProject' title='Delete'>&times;</a>"
      );
      projectEntry
        .append(projectName)
        .append(projectPercent)
        .append(projectStart)
        .append(projectDelete);
      $('#projects').append(projectEntry);
      i++;
    }
  }
  $('#project-settings, #project-run').hide();
  $('#initial').show();
  console.log(userData);
}
/**
 * @param  {number | string} timestamp
 * @param  {boolean} [dateOnly]
 */
function formatTimestamp(timestamp, dateOnly) {
  if (typeof timestamp == 'undefined' || timestamp === 0) {
    return 'never';
  }
  if (typeof dateOnly == 'undefined') {
    dateOnly = false;
  }
  if (typeof timestamp == 'string') {
    timestamp = parseInt(timestamp);
  }
  const dateObj = new Date(timestamp);
  const d = {
    year: pad(dateObj.getFullYear().toString().substr(2, 2), 2),
    month: pad(dateObj.getMonth() + 1, 2),
    day: pad(dateObj.getDate(), 2),
    hour: pad(dateObj.getHours(), 2),
    minute: pad(dateObj.getMinutes(), 2),
    second: pad(dateObj.getSeconds(), 2),
  };
  if (dateOnly) {
    // american format: dd/mm/yyyy
    return `${d.month}/${d.day}/${d.year}`;
  } else {
    // american format: hh:mm:ss dd/mm/yyyy
    return `${d.hour}:${d.minute}:${d.second} ${d.month}/${d.day}/${d.year}`;
  }
}
/**
 * @param  {number | string} n
 * @param  {number} width
 * @param  {string} [z]
 */
function pad(n, width, z) {
  z = z || '0';
  n = `${n}`;
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function createProject() {
  const projectID = `${new Date().getTime()}`;
  userData.projects[projectID] = newProjectTemplate;
  saveUserData();
  $('#cancelChanges').hide();
  openProject(projectID);
}

/**
 * @param  {string} projectID
 * @returns {false | void}
 */
function openProject(projectID) {
  stopListening();
  if (!(projectID in userData.projects)) {
    return false;
  }
  const project = userData.projects[projectID];
  $('#projectID').val(projectID);
  $('#projectName').val(project.name);
  $('#projectRow').val(project.row);
  $('#projectGoal').val(project.goal);
  $('#projectFreq').val(project.freq);
  $('#projectFreqStart').val(project.freqStart);
  $('#lastRow').data('value', project.prevRowTime).text(formatTimestamp(project.prevRowTime));
  if (project.freq) {
    $('#projectAdvSettings').show();
  } else {
    $('#projectAdvSettings').hide();
  }

  $('#initial, #project-run').hide();
  $('#project-settings').show();
}

/**
 * @param  {string} projectID
 * @returns {false | void}
 */
function deleteProject(projectID) {
  if (!(projectID in userData.projects)) {
    return false;
  }
  const projectName = userData.projects[projectID].name;
  const doDelete = confirm(`are you sure you want to delete the project ${projectName}?`);
  if (!doDelete) {
    return false;
  }
  $('#projects tr').each(function () {
    if ($(this).data('project') === projectID) {
      $(this).remove();
    }
  });
  delete userData.projects[projectID];
  saveUserData();
}

function storeProjectSettings() {
  const projectID = /** @type string */ ($('#projectID').val());
  /** @type ProjectSettings */
  const projectSettings = {
    name: /** @type string */ ($('#projectName').val()),
    row: parseInt(/** @type string */ ($('#projectRow').val())),
    goal: parseInt(/** @type string */ ($('#projectGoal').val())),
    freq: parseInt(/** @type string */ ($('#projectFreq').val())),
    freqStart: parseInt(/** @type string */ ($('#projectFreqStart').val())),
    prevRowTime: $('#lastRow').data('value'),
  };
  userData.projects[projectID] = projectSettings;
  saveUserData();
}
/**
 * @returns {false | void}
 */
function runProject() {
  const projectID = /** @type string */ ($('#projectID').val());
  if (!(projectID in userData.projects)) {
    return false;
  }
  const project = userData.projects[projectID];
  $('#projectHeader').text(project.name);
  $('#rowCount').val(project.row);
  placeFreqPips(project.freq, project.row - project.freqStart);
  $('#goalNum').text(project.goal);
  let percent = 0;
  if (project.goal > 0) {
    percent = Math.floor((project.row / project.goal) * 100);
  }
  $('#goalPercent').text(percent);
  setColors(percent);
  startListening(projectID);
  $('#initial, #project-settings').hide();
  $('#project-run').show();
}

let keyIsDown = true;

/**
 * @param  {string} projectID
 * @returns {void}
 */
function startListening(projectID) {
  $('#addRow').on('click', function () {
    increment(projectID);
  });
  $(document).on('keydown', function (e) {
    e.preventDefault();
    if (e.keyCode === userData.settings.key && !keyIsDown) {
      keyIsDown = true;
      increment(projectID);
    }
  });
  $(document).on('keyup', function (e) {
    if (e.keyCode === userData.settings.key) {
      keyIsDown = false;
    }
  });
}

/**
 * @returns {void}
 */
function stopListening() {
  $('#addRow').off('click');
  $(document).off('keydown');
  $(document).off('keyup');
  keyIsDown = false;
}

/**
 * @param  {string} projectID
 * @returns {false | void}
 */
function increment(projectID) {
  if (!(projectID in userData.projects)) {
    return false;
  }
  const project = userData.projects[projectID];
  project.row += 1;
  project.prevRowTime = new Date().getTime();
  userData.projects[projectID] = project;
  saveUserData();
  $('#rowCount').val(project.row);
  $('#lastRow').data('value', project.prevRowTime).text(formatTimestamp(project.prevRowTime));
  placeFreqPips(project.freq, project.row - project.freqStart);
  let percent = 0;
  if (project.goal > 0) {
    percent = Math.floor((project.row / project.goal) * 100);
  }
  $('#goalPercent').text(percent);
  setColors(percent);
}

/**
 * @param  {number} freq
 * @param  {number} count
 */
function placeFreqPips(freq, count) {
  $('#freqPips').html('');
  if (typeof freq == 'undefined' || !freq || freq <= 1) {
    return;
  }
  const currentPip = count % freq;
  const completeLoops = Math.floor(count / freq);
  let $element;
  $('#freqPips').append($('<b></b>').text(`${completeLoops}x +`));
  for (let i = 0; i < freq; i++) {
    $element = $('<span></span>');
    if (i <= currentPip) {
      $element.addClass('color-pip-done');
    } else {
      $element.addClass('color-pip');
    }
    $('#freqPips').append($element);
  }
}
/**
 * @param  {number} percent
 * @returns {void}
 */
function setColors(percent) {
  $('#rowCount').removeClass('percent0  percent10 percent20 percent30 percent40  percent50');
  $('#rowCount').removeClass('percent60 percent70 percent80 percent90 percent100 percentOver');
  if (percent < 10) {
    $('#rowCount').addClass('percent0');
  } else if (percent < 20) {
    $('#rowCount').addClass('percent10');
  } else if (percent < 30) {
    $('#rowCount').addClass('percent20');
  } else if (percent < 40) {
    $('#rowCount').addClass('percent30');
  } else if (percent < 50) {
    $('#rowCount').addClass('percent40');
  } else if (percent < 60) {
    $('#rowCount').addClass('percent50');
  } else if (percent < 70) {
    $('#rowCount').addClass('percent60');
  } else if (percent < 80) {
    $('#rowCount').addClass('percent70');
  } else if (percent < 90) {
    $('#rowCount').addClass('percent80');
  } else if (percent < 100) {
    $('#rowCount').addClass('percent90');
  } else if (percent === 100) {
    $('#rowCount').addClass('percent100');
  } else {
    $('#rowCount').addClass('percentOver');
  }
}
