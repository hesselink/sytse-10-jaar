interface GameState {
  robot: [number, number];
  program: Instr[];
  obstacles: Obstacle[];
  status: Status;
}

enum Instr {
  Up,
  Right,
  Down,
  Left
}

interface Obstacle {
  type: string;
  position: [number, number];
}

enum Status {
  Alive,
  Dead
}

const GRIDSIZE = 800;
const BOXES = 8
const BOXWIDTH = GRIDSIZE / BOXES;
const defaultState: GameState =
  { robot: [0,0]
  , program: [ ]
  , obstacles: [
      { type: "water"
      , position: [1,0]
      },
      { type: "water"
      , position: [1,1]
      },
      { type: "water"
      , position: [1,2]
      },
      { type: "fire"
      , position: [3,3]
      },
      { type: "hole"
      , position: [0,4]
      },
      { type: "hole"
      , position: [1,4]
      },
      { type: "hole"
      , position: [2,4]
      },
      { type: "water"
      , position: [4,5]
      },
      { type: "water"
      , position: [4,6]
      },
      { type: "water"
      , position: [5,5]
      },
      { type: "water"
      , position: [6,5]
      },
      { type: "water"
      , position: [5,4]
      },
      { type: "water"
      , position: [6,4]
      },
      { type: "water"
      , position: [5,3]
      },
      { type: "water"
      , position: [6,3]
      },
      { type: "water"
      , position: [7,3]
      },
      { type: "water"
      , position: [6,2]
      },
      { type: "water"
      , position: [7,2]
      },
      { type: "fire"
      , position: [1,6]
      },
    ]
  , status: Status.Alive
  };

const images: { [key: string]: HTMLImageElement } =
  { robot: new Image()
  , dead: new Image()
  , water: new Image()
  , fire: new Image()
  , hole: new Image()
  , gift: new Image()
  };

for (let key in images) {
  images[key].src = key + ".png";
}



window.addEventListener("DOMContentLoaded", e => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(0.5, 0.5);
  let state = defaultState;

  render(ctx, state);

  canvas.addEventListener("click", e => {
    render(ctx, state);
  });

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    render(ctx, state);
  });

  document.addEventListener("keydown", e => {
    state = handleKeyPress(state, e);
    render(ctx, state);
  });

  const runBtn = document.getElementById("run") as HTMLButtonElement;
  runBtn.addEventListener("click", async e => {
    state = await run(ctx, state);
    render(ctx, state);
  });

  const upBtn = document.getElementById("up") as HTMLButtonElement;
  upBtn.addEventListener("click", e => {
    state = addInstr(state, Instr.Up);
    render(ctx, state);
  });

  const rightBtn = document.getElementById("right") as HTMLButtonElement;
  rightBtn.addEventListener("click", e => {
    state = addInstr(state, Instr.Right);
    render(ctx, state);
  });

  const downBtn = document.getElementById("down") as HTMLButtonElement;
  downBtn.addEventListener("click", e => {
    state = addInstr(state, Instr.Down);
    render(ctx, state);
  });

  const leftBtn = document.getElementById("left") as HTMLButtonElement;
  leftBtn.addEventListener("click", e => {
    state = addInstr(state, Instr.Left);
    render(ctx, state);
  });

  const programEl = document.getElementById("program") as HTMLElement;
  programEl.addEventListener("click", e => {
    state = clickInstr(e.target, state);
    render(ctx, state);
  });
});

async function run(ctx: CanvasRenderingContext2D, state: GameState): Promise<GameState> {
  state.robot = [0,0];
  state.status = Status.Alive;
  render(ctx, state);
  await sleep(1);
  for (var i = 0; i < state.program.length; i++) {
    console.log("1", state);
    state = runOne(ctx, state, state.program[i]);
    console.log("2", state);
    render(ctx, state);
    if (eqArray(state.robot, [7,7])) {
      showEnd();
      break;
    } else if (hitObstacle(state)) {
      await sleep(1);
      return { ...state, status: Status.Dead }
    } else {
      await sleep(1);
    }
  }
  console.log("3", state);
  return state;
}

function addInstr(state: GameState, instr: Instr): GameState {
  return { ...state, program: [ ...state.program, instr] }
}

function runOne(ctx: CanvasRenderingContext2D, state: GameState, instr: Instr): GameState {
  switch(instr) {
    case Instr.Up:
      if (state.robot[1] > 0) {
        state = { ...state, robot: [state.robot[0], state.robot[1] - 1] };
      }
      break;
    case Instr.Right:
      if (state.robot[0] < BOXES) {
        state = { ...state, robot: [state.robot[0] + 1, state.robot[1]] };
      }
      break;
    case Instr.Down:
      if (state.robot[1] < BOXES) {
        state = { ...state, robot: [state.robot[0], state.robot[1] + 1] };
      }
      break;
    case Instr.Left:
      if (state.robot[0] > 0) {
        state = { ...state, robot: [state.robot[0] - 1, state.robot[1]] };
      }
      break;
  }
  return state;
}

function hitObstacle(state: GameState): boolean {
  return state.obstacles.find(o => eqArray(o.position, state.robot)) !== undefined
}

function clickInstr(el: EventTarget | null, state: GameState): GameState {
  if (el === null || !(el instanceof Element) || !(el as Element).classList.contains("instr")) {
    return state;
  }
  const parent = el.parentNode!;
  const ix = Array.prototype.indexOf.call(parent.childNodes, el);
  return { ...state, program: state.program.filter((_, curIx) => ix != curIx) }
}

function showEnd(): void {
  document.getElementById("game")!.style.display = "none";
  document.getElementById("end")!.style.display = "block";
}

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.clearRect(0, 0, GRIDSIZE, GRIDSIZE);
  drawGrid(ctx);
  drawEnd(ctx);
  drawObstacles(ctx, state);
  drawState(ctx, state);
}

function drawState(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawRobot(ctx, state);
  drawProgram(state.program);
}

function drawRobot(ctx: CanvasRenderingContext2D, state: GameState): void {
  const pos = state.robot;
  const img = state.status == Status.Alive ? images.robot : images.dead;
  drawImage(ctx, img, pos)
}

function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, pos: [number, number]): void {
  if (img.complete) {
    ctx.drawImage(img, pos[0] * BOXWIDTH + 1, pos[1] * BOXWIDTH + 1, BOXWIDTH - 2, BOXWIDTH - 2);
  } else {
    img.addEventListener("load", () => {
      ctx.drawImage(img, pos[0] * BOXWIDTH + 1, pos[1] * BOXWIDTH + 1, BOXWIDTH - 2, BOXWIDTH - 2);
    });
  }
}

function drawProgram(program: Instr[]): void {
  const el = document.getElementById("program")!;
  el.innerHTML = "";
  program.forEach(instr => addInstrEl(el, instr));
}

function addInstrEl(parent: HTMLElement, instr: Instr): void {
  const img = document.createElement("img");
  img.src = imgSrcFromInstr(instr);
  img.classList.add("instr");
  parent.appendChild(img);
}

function imgSrcFromInstr(instr: Instr): string {
  switch (instr) {
    case Instr.Up:
      return "up.png";
    case Instr.Right:
      return "right.png";
    case Instr.Down:
      return "down.png";
    case Instr.Left:
      return "left.png";
  }
}

function drawEnd(ctx: CanvasRenderingContext2D): void {
  drawImage(ctx, images.gift, [7,7]);
}

function drawObstacles(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.obstacles.forEach(obstacle => drawObstacle(ctx, obstacle));
}

function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle): void {
  drawImage(ctx, images[obstacle.type], obstacle.position);
}

function drawGrid(ctx: CanvasRenderingContext2D): void {
  for (let i=0; i<=GRIDSIZE; i+=GRIDSIZE/BOXES) {
    line(ctx, 0, i, GRIDSIZE, i);
    line(ctx, i, 0, i, GRIDSIZE);
  }
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

function handleKeyPress(state: GameState, e: KeyboardEvent): GameState {
  switch(e.code) {
    default:
      console.log("keypress", e.code);
  }
  return state;
}

async function sleep(sec: number) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

function groupBy<T, U>(xs: T[], eq: (v1: T, v2: T) => boolean): T[][] {
  let cur: T[] = [];
  const result = [];
  for (let x of xs) {
    if (cur.length === 0 || eq(cur[0], x)) {
      cur.push(x);
    } else {
      result.push(cur);
      cur = [x];
    }
  }
  if (cur.length > 0) {
    result.push(cur);
  }
  return result;
}

function eqArray<T>(a1: T[], a2: T[]): boolean {
  if (a1.length !== a2.length) {
    return false;
  }

  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }

  return true;
}

function transpose<T>(xss: T[][]): T[][] {
  const res: T[][] = [];
  for (let y = 0; y < BOXES; y++) {
    for (let x = 0; x < BOXES; x++) {
      if (xss[y]?.[x] !== undefined) {
        if (res[x] === undefined) {
          res[x] = [];
        }
        res[x][y] = xss[y][x];
      }
    }
  }
  return res;
}

function pad<T>(arr: T[], len: number, x: T) {
  const result = arr.slice();
  for (let i = arr.length; i < len; i++) {
    arr.unshift(x)
  }
  return arr;
}
