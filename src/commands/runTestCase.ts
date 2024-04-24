import * as vscode from "vscode";
import { searchProblem } from "../libs/searchProblem";
import { getProbNum } from "../libs/getProbNum";
import { spawn, execSync } from "child_process";
import * as path from "path";
import { outputChannel } from "../libs/getTestOutputChan";
export async function runTestCase(context: vscode.ExtensionContext) {
	try {
		const problemNumber = getProbNum();

		if (!problemNumber) {
			vscode.window.showErrorMessage("Problem number not found.");
			return;
		}

		const sp = await searchProblem(problemNumber, context);

		if (!sp.sampleInputs || !sp.sampleOutputs) {
			vscode.window.showErrorMessage(
				"Sample inputs or outputs not found."
			);
			return;
		}

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage("No editor found.");
			return;
		}

		const filePath = editor.document.uri.fsPath;

		const config = vscode.workspace.getConfiguration("BOJ");
		const extension = config.get<string>("extension", "");

		const maxWidth = 40;

		const preMessage1 = centerText(
			` ${problemNumber}. ${sp.title} `,
			maxWidth
		);
		const preMessage2 = `문제링크: https://boj.kr/${problemNumber}`;

		outputChannel.appendLine(preMessage1);
		outputChannel.appendLine(preMessage2);
		outputChannel.appendLine(``);

		const createOutputMessage = (
			testCaseIndex,
			result,
			expected,
			actual
		) => {
			const passedMessage = `✅ Test Case #${testCaseIndex + 1}:\n${centerText("Expected==Actual:", maxWidth)}\n${actual}`;
			const failedMessage = `❌ Test Case #${testCaseIndex + 1
				}: Failed\n${centerText(
					` Expected `,
					maxWidth
				)}\n${expected}${centerText(` Actual `, maxWidth)}\n${actual}`;

			return result ? passedMessage : failedMessage;
		};

		const runTest = (input, expectedOutput, testCaseIndex) => {
			return new Promise<void>((resolve, reject) => {
				const processIO = getProcessIO(extension, filePath);
				let outputData = "";

				processIO!.stdout.on("data", (data) => {
					outputData += data.toString();
				});

				processIO!.stderr.on("data", (data) => {
					console.error(`에러: ${data}`);
					outputData += data.toString();
				});

				processIO!.on("close", (code) => {
					const actualOutput = outputData.trim();
					const isPassed = actualOutput === expectedOutput.trim();
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
					console.error(`에러: ${err}`);
					outputData += err.toString();
				});

				processIO!.stdin.write(input);
				processIO!.stdin.end();
			});
		};
		outputChannel.clear()

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
				RUSTC_FLAGS: "-D tempdir=/tmp",
			},
		};
		execSync(
			`rustc --crate-name "${crateName}" "${filePath}" -o "${objectFileURL}"`,
			options
		);
		return spawn(`${dirName}/${objectFileURL}`);
	} else if (extension === "py") {
		return spawn("python3", [filePath]);
	}
}
