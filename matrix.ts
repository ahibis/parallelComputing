interface Options {
  cors_count: number;
  read_tacts: number;
  write_tacts: number;
  add_tacts: number;
  mul_tacts: number;
};

function solve({cors_count,add_tacts,mul_tacts,read_tacts,write_tacts}:Options) {
  const CORS_COUNT = cors_count;
  const READ_TACTS = read_tacts;
  const WRITE_TACTS = write_tacts;
  const ADD_TACTS = add_tacts;
  const MUL_TACTS = mul_tacts;

  const base = [1, 2, 3];
  const A = base.map((v1) => base.map((v2) => `a${v1}${v2}`));
  const B = base.map((v1) => base.map((v2) => `b${v1}${v2}`));

  class Task {
    tacts: number;
    constructor() {
      this.tacts = 0;
    }
    getRes(): string | undefined {
      return undefined;
    }
    execute() {
      this.tacts -= 1;
      if (this.tacts == 0) {
        return this.getRes();
      }
      return undefined;
    }
    canExecute(params: Set<string>) {
      return true;
    }
    toString() {
      return ``;
    }
    getIns(): string[] {
      return [];
    }
  }

  class Read extends Task {
    out: string;
    constructor(out: string) {
      super();
      this.tacts = READ_TACTS;
      this.out = out;
    }
    getRes() {
      return this.out;
    }
    toString() {
      return `read ${this.out}`;
    }
  }

  class Add extends Task {
    in1: string;
    in2: string;
    out: string;
    constructor(in1: string, in2: string, out: string) {
      super();
      this.tacts = ADD_TACTS;
      this.in1 = in1;
      this.in2 = in2;
      this.out = out;
    }
    getRes() {
      return this.out;
    }
    toString() {
      return `${this.out} = ${this.in1} + ${this.in2}`;
    }
    canExecute(params: Set<string>) {
      return params.has(this.in1) && params.has(this.in2);
    }
    getIns(): string[] {
      return [this.in1, this.in2];
    }
  }

  class Mul extends Task {
    in1: string;
    in2: string;
    out: string;
    constructor(in1: string, in2: string, out: string) {
      super();
      this.tacts = MUL_TACTS;
      this.in1 = in1;
      this.in2 = in2;
      this.out = out;
    }
    getRes() {
      return this.out;
    }
    toString() {
      return `${this.out} = ${this.in1} * ${this.in2}`;
    }
    canExecute(params: Set<string>) {
      return params.has(this.in1) && params.has(this.in2);
    }
    getIns(): string[] {
      return [this.in1, this.in2];
    }
  }

  class Write extends Task {
    in1: string;
    constructor(in1: string) {
      super();
      this.tacts = WRITE_TACTS;
      this.in1 = in1;
    }
    getRes() {
      return this.in1;
    }
    toString() {
      return `write ${this.in1}`;
    }
    canExecute(params: Set<string>) {
      return params.has(this.in1);
    }
    getIns(): string[] {
      return [this.in1];
    }
  }

  function getInParams(tasks: Task[]) {
    const res: { [key: string]: number } = {};
    const ins = tasks.flatMap((task) => task.getIns());
    for (let param of ins) {
      res[param] = res[param] ? res[param] + 1 : 1;
    }
    return res;
  }

  function transpose<T>(A: T[][]) {
    const res = Array.from(new Array(A[0].length), (v) =>
      new Array(A.length).fill(undefined)
    );
    A.forEach((line, i) =>
      line.forEach((v, k) => {
        res[k][i] = v;
      })
    );
    return res;
  }

  class Scheduler {
    runningTasks: (Task | undefined)[] = new Array(CORS_COUNT).fill(undefined);
    tasks: Task[];
    params: Set<string> = new Set<string>();
    inParams: { [key: string]: number };
    constructor(tasks: Task[]) {
      this.tasks = tasks;
      this.inParams = getInParams(tasks);
    }
    nextTact() {
      const { runningTasks, params, tasks, inParams } = this;
      const addedParams = new Set<string>();
      const removedParams = new Set<string>();

      runningTasks.forEach((task, i) => {
        if (!task) return;
        const res = task.execute();
        if (res) {
          addedParams.add(res);
          params.add(res);
          task.getIns().forEach((param) => {
            inParams[param] -= 1;
            if (inParams[param] == 0) {
              params.delete(param);
              removedParams.add("-" + param);
            }
          });
          runningTasks[i] = undefined;
        }
      });

      const res = runningTasks.map(() => "");
      runningTasks.forEach((runningTask, i) => {
        if (runningTask) return;
        for (let [k, task] of tasks.entries()) {
          if (task.canExecute(this.params)) {
            runningTasks[i] = task;
            res[i] = task.toString();
            tasks.splice(k, 1);
            break;
          }
        }
      });

      const paramsStyles = [...params].map((param) => {
        if (addedParams.has(param)) return "+" + param;
        return param;
      });

      const paramsStr = [
        paramsStyles.length,
        ...paramsStyles,
        ...removedParams,
      ].join(" ");
      return [...res, paramsStr];
    }
    run() {
      const res: string[][] = [];
      while (
        this.tasks.length ||
        !this.runningTasks.every((e) => e == undefined)
      ) {
        res.push(this.nextTact());
      }
      const resT = transpose(res);
      const lastLine = resT[resT.length - 1];
      resT[resT.length - 1] = lastLine.map((v, i) => lastLine[i + 1] || "");

      const text = resT
        .map((line) => line.map((v) => `"${v}"`).join(";"))
        .join("\n");
      return text;
    }
  }

  const readTasks: Task[] = [];
  const mulTasks: Task[] = [];
  const addTasks1: Task[] = [];
  const addTasks2: Task[] = [];
  const writeTask: Task[] = [];

  A.flat().forEach((v) => readTasks.push(new Read(v)));
  B.flat().forEach((v) => readTasks.push(new Read(v)));

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const a1 = A[0][column];
      const a2 = A[1][column];
      const a3 = A[2][column];
      const b1 = B[row][0];
      const b2 = B[row][1];
      const b3 = B[row][2];

      const suffix = `${row + 1}${column + 1}`;
      mulTasks.push(
        new Mul(a1, b1, `c${suffix}1`),
        new Mul(a2, b2, `c${suffix}2`),
        new Mul(a3, b3, `c${suffix}3`)
      );
      addTasks1.push(new Add(`c${suffix}1`, `c${suffix}2`, `d${suffix}`));
      addTasks2.push(new Add(`d${suffix}`, `c${suffix}3`, `e${suffix}`));
      writeTask.push(new Write(`e${suffix}`));
    }
  }
  const tasks = [
    ...readTasks,
    ...mulTasks,
    ...addTasks1,
    ...addTasks2,
    ...writeTask,
  ];

  const scheduler = new Scheduler(tasks);
  return scheduler.run();
}