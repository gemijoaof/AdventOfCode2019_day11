const fs = require('fs');
const input = fs.readFileSync('./input.txt').toString();
let arrayinput = input.split(',').map(str => Number(str));

const resizeArray = (arrayProgram, newSize, defaultValue) => {
  let arr = [...arrayProgram];
  arr.length = newSize;

  return arrayProgram.map(item => (item === undefined ? defaultValue : item));
};

const runProgram = (array, arrayInputNumber, index = 0, relativeBase = 0) => {
  let arrayProgram = [...array];
  let result = null;
  let memory = [];

  while (true) {
    let valueStr = arrayProgram[index].toString();
    valueStr = valueStr.padStart(5, '0');
    const opcode = calcOpcode(valueStr);
    let listParamModes = calcListParamModes(valueStr);
    let param1 = calcParamIndex(
      arrayProgram,
      index,
      1,
      listParamModes[2],
      relativeBase
    );
    let param2 = calcParamIndex(
      arrayProgram,
      index,
      2,
      listParamModes[1],
      relativeBase
    );
    let param3 = calcParamIndex(
      arrayProgram,
      index,
      3,
      listParamModes[0],
      relativeBase
    );

    //guard close for negative index
    if (
      opcode === '01' ||
      opcode === '02' ||
      opcode === '07' ||
      opcode === '08'
    ) {
      if (param3 < 0) {
        return console.log(
          `ERROR: paramIndex3 can't be smaller than 0 when opcode is 1,2,7,8`
        );
      }
    } else if (opcode === '03' && param1 < 0) {
      return console.log(
        `ERROR: paramIndex1 can't be smaller than 0 when opcode is 3`
      );
    }

    switch (opcode) {
      case '01':
        arrayProgram[param3] = arrayProgram[param1] + arrayProgram[param2];
        index += 4;
        break;
      case '02':
        arrayProgram[param3] = arrayProgram[param1] * arrayProgram[param2];
        index += 4;
        break;
      case '03':
        //console.log(arrayInputNumber.length);
        if (arrayInputNumber.length === 0) {
          return {
            output: result,
            halted: false,
            index: index,
            relativeBaseSaved: relativeBase,
            program: arrayProgram,
            memory: memory
          };
        } else {
          arrayProgram[param1] = arrayInputNumber.shift();
        }
        index += 2;
        break;
      case '04':
        result = arrayProgram[param1];
        memory.push(result);
        index += 2;
        break;
      case '05':
        if (arrayProgram[param1] !== 0) {
          index = arrayProgram[param2];
        } else {
          index += 3;
        }
        break;
      case '06':
        if (arrayProgram[param1] === 0) {
          index = arrayProgram[param2];
        } else {
          index += 3;
        }
        break;
      case '07':
        if (arrayProgram[param1] < arrayProgram[param2]) {
          arrayProgram[param3] = 1;
        } else {
          arrayProgram[param3] = 0;
        }
        index += 4;
        break;
      case '08':
        if (arrayProgram[param1] === arrayProgram[param2]) {
          arrayProgram[param3] = 1;
        } else {
          arrayProgram[param3] = 0;
        }
        index += 4;
        break;
      case '09':
        //adjust the relative base
        relativeBase += arrayProgram[param1];
        index += 2;
        break;
      case '99':
        return {
          output: result,
          halted: true,
          index: index,
          relativeBaseSaved: relativeBase,
          program: arrayProgram,
          memory: memory
        };
      default:
        return console.log(`ERROR: opcode: ${opcode}`);
    }
  }
};

const calcOpcode = str => {
  return str[3] + str[4];
};

const calcListParamModes = completeOpcode => {
  return [
    Number(completeOpcode[0]),
    Number(completeOpcode[1]),
    Number(completeOpcode[2])
  ];
};

const calcParamIndex = (
  arrayProgram,
  index,
  param,
  paramMode,
  relativeBase
) => {
  let result = 0;

  if (paramMode === 0) {
    result = arrayProgram[index + param];
  } else if (paramMode === 1) {
    result = index + param;
    //relative mode
  } else if (paramMode === 2) {
    result = arrayProgram[index + param] + relativeBase;
  }
  return result;
};

const paintingRobot = (arrayProgram, panelColor) => {
  let program = resizeArray(arrayProgram, 1000, 0);
  let color = panelColor;
  let indexSaved = 0;
  let relativeBaseSaved = 0;
  let listPanels = [];
  let position = [0, 0];
  let direction = '^';
  let started = false;

  while (true) {
    if (started) {
      color = getColor(listPanels, position);
    } else {
      started = true;
    }

    let result = runProgram(program, [color], indexSaved, relativeBaseSaved);
    let resultOuput = result.memory;
    color = resultOuput[0];
    indexSaved = result.index;
    relativeBaseSaved = result.relativeBaseSaved;
    program = result.program;

    let panel = getPanel(listPanels, position);
    if (panel !== null) {
      panel.color = color;
    } else {
      listPanels.push({ position: position, color: color });
    }

    let instDirection = resultOuput[1];
    direction = calcNewDirection(instDirection, direction);
    position = calcNewPosition(direction, position);

    if (result.halted) {
      break;
    }
  }

  return listPanels;
};

const calcNewPosition = (direction, position) => {
  let result = [...position];

  switch (direction) {
    case '^':
      result[1]++;
      break;
    case '>':
      result[0]++;
      break;
    case 'v':
      result[1]--;
      break;
    case '<':
      result[0]--;
      break;

    default:
      break;
  }

  return result;
};

const calcNewDirection = (instDirection, direction) => {
  arrayDirections = ['^', '>', 'v', '<'];
  index = arrayDirections.indexOf(direction);

  if (instDirection === 0) {
    index--;
    index < 0 ? (index = arrayDirections.length - 1) : (index = index);
  } else {
    index++;
    index === arrayDirections.length ? (index = 0) : (index = index);
  }

  return arrayDirections[index];
};

const getPanel = (listPanels, position) => {
  if (listPanels.length === 0) return null;

  for (const panel of listPanels) {
    if (
      panel.position[0] === position[0] &&
      panel.position[1] === position[1]
    ) {
      return panel;
    }
  }

  return null;
};

const getColor = (listPanels, position) => {
  const panel = getPanel(listPanels, position);

  return panel === null ? 0 : panel.color;
};

const part1 = () => {
  const list = paintingRobot(arrayinput, 0);
  return list.length;
};

const part2 = () => {
  let listPanels = paintingRobot(arrayinput, 1);
  let [minX, maxX, minY, maxY] = [null, null, null, null];

  //const maxX = Math.max(listPanels.map(i => i.position[0]));

  //find grid min and max X & y
  for (const panel of listPanels) {
    if (minX === null || minY === null || maxX === null || maxY === null) {
      minX = panel.position[0];
      maxX = panel.position[0];
      minY = panel.position[1];
      maxY = panel.position[1];
    } else {
      if (panel.position[0] < minX) {
        minX = panel.position[0];
      } else if (panel.position[0] > maxX) {
        maxX = panel.position[0];
      }
      if (panel.position[1] < minY) {
        minY = panel.position[1];
      } else if (panel.position[1] > maxY) {
        maxY = panel.position[1];
      }
    }
  }

  //build and print grid
  let grid = [];
  for (let y = maxY; y >= minY; y--) {
    let line = [];
    for (let x = minX; x <= maxX; x++) {
      let color = findColor(listPanels, x, y);
      color = color === 0 || color === null ? ' ' : '#';
      line.push(color);
    }
    grid.push(line.join(''));
  }

  return grid;
};

const findColor = (listPanels, x, y) => {
  for (const panel of listPanels) {
    if (panel.position[0] === x && panel.position[1] === y) {
      return panel.color;
    }
  }

  return null;
};

console.time('part1');
console.log(part1());
console.timeEnd('part1');
console.log(' ');
console.time('part2');
console.log(part2());
console.timeEnd('part2');

/////////////////////////////TESTs/////////////////////////////////////////////

let test =
  '3,8,1005,8,338,1106,0,11,0,0,0,104,1,104,0,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,1,10,4,10,1002,8,1,29,2,105,19,10,1006,0,52,1,1009,7,10,1006,0,6,3,8,102,-1,8,10,101,1,10,10,4,10,108,1,8,10,4,10,1001,8,0,64,2,1002,19,10,1,8,13,10,1,1108,16,10,2,1003,1,10,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,1,10,4,10,1002,8,1,103,1006,0,10,2,109,16,10,1,102,11,10,2,6,13,10,3,8,102,-1,8,10,1001,10,1,10,4,10,1008,8,0,10,4,10,1002,8,1,140,2,102,8,10,2,4,14,10,1,8,19,10,1006,0,24,3,8,1002,8,-1,10,101,1,10,10,4,10,1008,8,0,10,4,10,1001,8,0,177,1006,0,16,1,1007,17,10,3,8,102,-1,8,10,1001,10,1,10,4,10,108,1,8,10,4,10,101,0,8,205,3,8,1002,8,-1,10,1001,10,1,10,4,10,1008,8,0,10,4,10,102,1,8,228,1,1005,1,10,1,9,1,10,3,8,102,-1,8,10,101,1,10,10,4,10,1008,8,1,10,4,10,1002,8,1,258,3,8,1002,8,-1,10,1001,10,1,10,4,10,108,0,8,10,4,10,102,1,8,279,3,8,102,-1,8,10,1001,10,1,10,4,10,108,0,8,10,4,10,102,1,8,301,1,3,17,10,2,7,14,10,2,6,18,10,1,1001,17,10,101,1,9,9,1007,9,1088,10,1005,10,15,99,109,660,104,0,104,1,21102,1,48092525312,1,21101,355,0,0,1106,0,459,21102,665750184716,1,1,21102,366,1,0,1106,0,459,3,10,104,0,104,1,3,10,104,0,104,0,3,10,104,0,104,1,3,10,104,0,104,1,3,10,104,0,104,0,3,10,104,0,104,1,21102,1,235324768296,1,21101,0,413,0,1105,1,459,21101,3263212736,0,1,21102,424,1,0,1106,0,459,3,10,104,0,104,0,3,10,104,0,104,0,21102,1,709496824676,1,21101,447,0,0,1105,1,459,21102,988220904204,1,1,21102,1,458,0,1106,0,459,99,109,2,21201,-1,0,1,21102,40,1,2,21102,490,1,3,21102,1,480,0,1105,1,523,109,-2,2106,0,0,0,1,0,0,1,109,2,3,10,204,-1,1001,485,486,501,4,0,1001,485,1,485,108,4,485,10,1006,10,517,1101,0,0,485,109,-2,2105,1,0,0,109,4,2101,0,-1,522,1207,-3,0,10,1006,10,540,21102,0,1,-3,22101,0,-3,1,22102,1,-2,2,21102,1,1,3,21101,559,0,0,1106,0,564,109,-4,2105,1,0,109,5,1207,-3,1,10,1006,10,587,2207,-4,-2,10,1006,10,587,22102,1,-4,-4,1105,1,655,22101,0,-4,1,21201,-3,-1,2,21202,-2,2,3,21102,606,1,0,1105,1,564,21202,1,1,-4,21101,0,1,-1,2207,-4,-2,10,1006,10,625,21102,0,1,-1,22202,-2,-1,-2,2107,0,-3,10,1006,10,647,22101,0,-1,1,21101,647,0,0,105,1,522,21202,-2,-1,-2,22201,-4,-2,-4,109,-5,2106,0,0';

test = test.split(',').map(str => Number(str));
