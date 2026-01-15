import * as vscode from "vscode";
import { searchProblem } from "../libs/searchProblem";
import { spawn, execSync } from "child_process";
import * as path from "path";
import { findSourceFileByProblemNumber } from "../libs/findSourceFile";
import { getProbNum } from "../libs/getProbNum";

export async function runTestCase(
  context: vscode.ExtensionContext,
  problemNumber?: string
) {
  let editor = vscode.window.activeTextEditor;
  let filePath: string | undefined;

  // 단계 1: 문제 번호 확인
  let probNum = problemNumber;

  if (!probNum) {
    probNum = getProbNum();
  }

  if (!probNum) {
    vscode.window.showErrorMessage("문제 번호를 찾을 수 없습니다.");
    return;
  }

  // 단계 2: 소스 코드 파일 찾기
  if (editor) {
    // 이미 열린 에디터가 있는 경우 해당 파일 사용
    filePath = editor.document.uri.fsPath;
  } else {
    // 에디터가 열려있지 않다면 워크스페이스에서 해당 문제 번호의 파일 찾기
    filePath = await findSourceFileByProblemNumber(probNum);

    if (!filePath) {
      vscode.window.showErrorMessage(
        `문제 ${probNum}번의 소스 코드 파일을 찾을 수 없습니다.`
      );
      return;
    }
  }

  // 파일을 찾았다면 컴파일하고 실행하기 (파일을 열지 않고도 가능)
  const outputChannel = vscode.window.createOutputChannel("Test Cases");
  try {
    const sp = await searchProblem(probNum, context);

    if (!sp.sampleInputs || !sp.sampleOutputs) {
      vscode.window.showErrorMessage(
        "예제 입력 또는 출력을 찾을 수 없습니다. 문제 페이지를 확인해주세요."
      );
      return;
    }

    const config = vscode.workspace.getConfiguration("BOJ");
    const extension = config.get<string>("extension", "");

    // 시간 제한 파싱 (초 단위)
    const timeLimit = parseTimeLimit(sp.limit);
    const timeLimitMs = timeLimit * 1000; // 밀리초로 변환

    const maxWidth = 40;

    const preMessage1 = centerText(` ${probNum}. ${sp.title} `, maxWidth);
    const preMessage2 = `문제링크: https://boj.kr/${probNum}`;

    outputChannel.appendLine(preMessage1);
    outputChannel.appendLine(preMessage2);
    outputChannel.appendLine(`시간 제한: ${timeLimit}초`);
    outputChannel.appendLine(``);

    filePath = filePath.replace(/\\/g, "/");

    outputChannel.appendLine(`소스 파일: "${filePath}"`);
    outputChannel.appendLine(``);

    const createOutputMessage = (testCaseIndex, result, expected, actual) => {
      const passedMessage = `✅ Test Case #${
        testCaseIndex + 1
      }: Passed\n${centerText(` Output `, maxWidth)}\n${actual}`;
      const failedMessage = `❌ Test Case #${
        testCaseIndex + 1
      }: Failed\n${centerText(` Expected `, maxWidth)}\n${expected}${centerText(
        ` Actual `,
        maxWidth
      )}\n${actual}`;

      return result ? passedMessage : failedMessage;
    };

    const runTest = (input, expectedOutput, testCaseIndex) => {
      return new Promise<void>((resolve, reject) => {
        const processIO = getProcessIO(extension, filePath!);
        let outputData = "";
        let isTimeout = false;

        // 문제별 시간 제한 사용 (최소 1초, 최대 10초)
        const actualTimeLimit = Math.max(1000, Math.min(timeLimitMs, 10000));
        const timeout = setTimeout(() => {
          isTimeout = true;
          processIO!.kill("SIGKILL");
          const timeoutMessage = `⏰ Test Case #${
            testCaseIndex + 1
          }: Time Limit Exceeded (${timeLimit}초 초과)`;
          outputChannel.appendLine(timeoutMessage);
          resolve();
        }, actualTimeLimit);

        processIO!.stdout.on("data", (data) => {
          outputData += data.toString();
        });

        processIO!.stderr.on("data", (data) => {
          console.error(`에러: ${data}`);
          outputData += data.toString();
        });

        processIO!.on("close", (code) => {
          clearTimeout(timeout);

          if (isTimeout) {
            return; // 이미 타임아웃 처리됨
          }

          const actualLines = normalizeOutput(outputData);
          const expectedLines = normalizeOutput(expectedOutput);

          const isPassed =
            actualLines.length === expectedLines.length &&
            actualLines.every((line, i) => line === expectedLines[i]);

          const actualOutput = actualLines.join("\n");

          const message = createOutputMessage(
            testCaseIndex,
            isPassed,
            expectedOutput,
            actualOutput
          );
          outputChannel.appendLine(message);

          resolve();
        });

        processIO!.on("error", (err) => {
          clearTimeout(timeout);
          console.error(`에러: ${err}`);
          outputData += err.toString();

          if (!isTimeout) {
            const errorMessage = `❌ Test Case #${
              testCaseIndex + 1
            }: Runtime Error\n${err.toString()}`;
            outputChannel.appendLine(errorMessage);
            resolve();
          }
        });

        processIO!.stdin.write(input);
        processIO!.stdin.end();
      });
    };

    for (let i = 0; i < sp.sampleInputs.length; i++) {
      await runTest(sp.sampleInputs[i], sp.sampleOutputs[i], i);
    }

    const postMessage1 = centerText(` 채점 종료 `, maxWidth - 2);
    outputChannel.appendLine(``);
    outputChannel.appendLine(postMessage1);
    outputChannel.show(true);
  } catch (error) {
    vscode.window.showErrorMessage(
      "테스트 케이스 실행 중 오류가 발생했습니다. 직접 실행해서 오류를 확인해주세요."
    );
  }
}

function centerText(text, maxWidth) {
  const padding = Math.max(0, maxWidth - text.length);
  const paddingLeft = Math.floor(padding / 2);
  const paddingRight = padding - paddingLeft;
  return "-".repeat(paddingLeft) + text + "-".repeat(paddingRight);
}

function parseTimeLimit(limitString: string | null): number {
  if (!limitString) {
    return 2; // 기본값 2초
  }

  // "시간 제한: 2 초" 형태에서 숫자 추출
  const match = limitString.match(/(\d+(?:\.\d+)?)\s*초/);
  if (match) {
    return parseFloat(match[1]);
  }

  // "Time limit: 2 seconds" 형태에서 숫자 추출
  const englishMatch = limitString.match(/(\d+(?:\.\d+)?)\s*seconds?/i);
  if (englishMatch) {
    return parseFloat(englishMatch[1]);
  }

  return 2; // 파싱 실패 시 기본값 2초
}

function getProcessIO(extension: string, filePath: string) {
  if (extension === "c") {
    const objectFileURL = filePath.replace(/\.[^/.]+$/, "");
    execSync(`gcc "${filePath}" -o "${objectFileURL}"`);
    return spawn(`${objectFileURL}`);
  } else if (extension === "cpp") {
    const objectFileURL = filePath.slice(0, filePath.length - 4);
    execSync(`g++ -std=c++17 "${filePath}" -o "${objectFileURL}"`);
    return spawn(`${objectFileURL}`);
  } else if (extension === "java") {
    const dirName = path.dirname(filePath);
    return spawn(`java`, ["-cp", dirName, filePath]);
  } else if (extension === "js") {
    return spawn("node", [filePath]);
  } else if (extension === "rs") {
    const fileName = path.basename(filePath, ".rs");
    const crateName = fileName.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
    const objectFileURL = path.join(".", `${crateName}.out`);
    const dirName = path.dirname(filePath);
    const options = {
      cwd: path.dirname(filePath),
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        RUSTC_FLAGS: "-D tempdir=/tmp",
      },
    };
    execSync(
      `rustc --crate-name "${crateName}" "${filePath}" -o "${objectFileURL}"`,
      options
    );
    return spawn(`${dirName}/${objectFileURL}`);
  } else if (extension === "py") {
    try {
      // python3 명령어를 먼저 시도
      execSync("python3 --version", { stdio: "ignore" });
      return spawn("python3", [filePath]);
    } catch (error) {
      // python3가 없으면 python 명령어 사용
      return spawn("python", [filePath]);
    }
  }
}

function normalizeOutput(output: string): string[] {
  return output
    .replace(/\r\n/g, "\n") // Windows 개행 통일
    .split("\n") // 줄 단위 분리
    .map((line) => line.replace(/\s+$/, "")) // 줄 끝 공백 제거
    .filter((line, idx, arr) => {
      // 맨 끝의 빈 줄 제거
      if (line !== "") {
        return true;
      }
      for (let i = idx; i < arr.length; i++) {
        if (arr[i] !== "") {
          return true;
        }
      }
      return false;
    });
}
