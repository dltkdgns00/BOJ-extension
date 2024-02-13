import * as vscode from "vscode";
import path from "path";
import fs from "fs";
import yaml from "yaml";

export async function makeWorkflow() {
	const config = vscode.workspace.getConfiguration("BOJ");
	const extension = config.get<string>("extension", "");
	const author = config.get<string>("author", "");
	var exNumber;
	if (extension === "cpp") {
		exNumber = 1001;
	} else if (extension === "java") {
		exNumber = 1002;
	} else if (extension === "py") {
		exNumber = 1003;
	} else if (extension === "c") {
		exNumber = 1004;
	} else if (extension === "rs") {
		exNumber = 1005;
	} else if (extension === "rb") {
		exNumber = 68;
	} else if (extension === "kt") {
		exNumber = 69;
	} else if (extension === "swift") {
		exNumber = 74;
	} else if (extension === "cs") {
		exNumber = 86;
	} else if (extension === "js") {
		exNumber = 17;
	} else if (extension === "go") {
		exNumber = 12;
	}

	try {
		// 폴더명 생성
		const folderName = ".github";
		const folderPath = path.join(
			vscode.workspace.workspaceFolders![0].uri.fsPath,
			folderName
		);
		fs.mkdirSync(folderPath, { recursive: true });

		const subFolderName = "workflows";
		const subFolderPath = path.join(folderPath, subFolderName);
		fs.mkdirSync(subFolderPath, { recursive: true });

		const content = {
			name: "Update Markdown Performance",
			on: {
				push: {
					paths: ["**.md"],
				},
			},
			jobs: {
				update: {
					"runs-on": "ubuntu-latest",
					steps: [
						{
							name: "Checkout Repository",
							uses: "actions/checkout@v2",
							with: {
								"fetch-depth": 0,
								token: "${{ secrets.GH_TOKEN }}",
							},
						},
						{
							name: "Get List of Not Filled Markdown Files",
							id: "getfile",
							run: [
								'echo "" > not_filled_files.txt',
								"while IFS= read -r -d $'\\0' file; do",
								'\tif ! grep -q "### 성능 요약" "$file"; then',
								'\t\techo "$file" >> not_filled_files.txt',
								"\tfi",
								'done < <(find . -name "*.md" -print0)',
							].join("\n"),
						},
						{
							name: "Update Performance in Markdown",
							uses: "dltkdgns00/BOJ-action@main",
							with: {
								path: "not_filled_files.txt",
								user_id: author,
								language_id: exNumber,
							},
						},
						{
							name: "remove not_filled_files.txt",
							run: ["rm not_filled_files.txt"].join("\n"),
						},
						{
							name: "Commit and push changes",
							run: [
								'git config --local user.email "github-actions[bot]@users.noreply.github.com"',
								'git config --local user.name "github-actions[bot]"',
								"git add .",
								"git status",
								'if [[ -n "$(git status --porcelain)" ]]; then',
								'\tgit commit -m "Update performance details"',
								"\tgit push",
								"else",
								'\techo "No changes to commit."',
								"fi",
							].join("\n"),
						},
					],
				},
			},
		};

		console.log(content);
		const yamlStr = yaml.stringify(content);
		const yamlFilePath = path.join(subFolderPath, "workflow.yml");
		fs.writeFile(yamlFilePath, yamlStr, (err) => {
			if (err) {
				throw err;
			}
		});
		console.log("YAML 파일이 성공적으로 생성되었습니다.");
	} catch (error) {
		if (error instanceof Error && (error as any).code === "EEXIST") {
			console.log(
				"workflow.yml 파일이 이미 존재하므로 생성하지 않습니다."
			);
			return;
		} else {
			vscode.window.showErrorMessage(
				"workflow.yml 파일 생성에 실패했습니다."
			);
			console.log(error);
			return;
		}
	}
}
