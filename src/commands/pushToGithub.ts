import simpleGit, { SimpleGit } from "simple-git";
import * as vscode from "vscode";
import { makeWorkflow } from "../libs/makeWorkflow";

export async function pushToGithub() {
	const git: SimpleGit = simpleGit(
		vscode.workspace.workspaceFolders![0].uri.fsPath
	);

	const commitMessage = `BOJ-EX: ${new Date().toLocaleString()}`;
	try {
		makeWorkflow();

		const isInitialized = await git.checkIsRepo();

		if (!isInitialized) {
			vscode.window.showErrorMessage(
				"현재 폴더는 Git 저장소가 아닙니다. Git 저장소를 초기화해주세요."
			);
			return;
		}

		// Git pull
		await git.pull();

		// Git add .
		await git.add(".");

		// Git commit -am "message"
		await git.commit(commitMessage);

		// Git push origin main (You can change "main" to your branch name)
		await git.push("origin", "main");

		vscode.window.showInformationMessage(
			"Github에 성공적으로 푸시되었습니다."
		);
	} catch (error) {
		vscode.window.showErrorMessage("Github에 푸시하는데 실패했습니다.");
		console.error(error);
	}
}
