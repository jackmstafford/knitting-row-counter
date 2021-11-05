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
 *    key: string;
 *  },
 *  projects: {
 *    [key: string]: ProjectSettings;
 *  }
 * }} UserData;
 */

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
    key: ' ',
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
    saveUserData();
  }
}

/**
 * @returns {void}
 */
function saveUserData() {
  cookie.write('knitting-data', userData, { expires: 30 });
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
  const $body = $('body');
  const $modal = $('#modal');
  const $currentKey = $('#currentKey');
  $currentKey.html(`"${userData.settings.key}"`);
  const $newKey = $('#newKey');
  /** @type string */
  let newKey;
  const openModal = () => {
    $newKey.html(`"${userData.settings.key}"`);
    $body.on('keydown', listener);
    $modal.css({ display: 'block' });
  };
  $('#changeKey').on('click', openModal);
  /**
   * @type {(e: JQuery.KeyDownEvent) => void}
   */
  const listener = (e) => {
    newKey = e.key;
    $newKey.html(`"${newKey}"`);
  };
  const closeModal = () => {
    $modal.css({ display: 'none' });
    $body.off('keydown', listener);
  };
  $('#closeModal, #cancelModal').on('click', closeModal);
  $('#acceptModal').on('click', () => {
    userData.settings.key = newKey;
    saveUserData();
    $currentKey.html(`"${newKey}"`);
    closeModal();
  });
}

function showProjectsPage() {
  stopListening();
  $('#projects').html('');
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
    }
  }
  $('#project-settings, #project-run').hide();
  $('#initial').show();
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
    if (e.key === userData.settings.key && !keyIsDown) {
      keyIsDown = true;
      increment(projectID);
    }
  });
  $(document).on('keyup', function (e) {
    if (e.key === userData.settings.key) {
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
