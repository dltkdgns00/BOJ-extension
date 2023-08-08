import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

export async function makeWorkflow()
{
    const config = vscode.workspace.getConfiguration('BOJ');
    const extension = config.get<string>('extension', '');
    const author = config.get<string>('author', '');
    var exNumber;
    if (extension === "cpp")
    {
        exNumber = 1001;
    }
    else if (extension === "java")
    {
        exNumber = 1002;
    }
    else if (extension === "py")
    {
        exNumber = 1003;
    }
    else if (extension === "c")
    {
        exNumber = 1004;
    }
    else if (extension === "rs")
    {
        exNumber = 1005;
    }
    else if (extension === "rb")
    {
        exNumber = 68;
    }
    else if (extension === "kt")
    {
        exNumber = 69;
    }
    else if (extension === "swift")
    {
        exNumber = 74;
    }
    else if (extension === "cs")
    {
        exNumber = 86;
    }
    else if (extension === "js")
    {
        exNumber = 17;
    }
    else if (extension === "go")
    {
        exNumber = 12;
    }

    try
    {
        // 폴더명 생성
        const folderName = ".github";
        const folderPath = path.join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            folderName
        );
        fs.mkdirSync(folderPath);

        const subFolderName = "workflows";
        const subFolderPath = path.join(folderPath, subFolderName);
        fs.mkdirSync(subFolderPath);

        // 파일명 생성
        const fileName = `workflow.yml`;

        // workflow.yml 파일 내용
        const content = `name: Update Markdown Performance\n\non:\n\tpush:\n\tpaths:\n\t- '**.md'\n\n\njobs:\n\tupdate:\n\truns-on: ubuntu-latest\n\tsteps:\n\t- name: Checkout Repository\n\t\tuses: actions/checkout@v2\n\t\twith:\n\t\tfetch-depth: 0\n\t\ttoken: \${{ secrets.GH_TOKEN }}\n\n\t- name: Get List of Not Filled Markdown Files\n\t\tid: getfile\n\t\trun: |\n\t\techo "" > not_filled_files.txt\n\n\t\twhile IFS= read -r -d $'\0' file; do\n\t\t\tif ! grep -q "### 성능 요약" "$file"; then\n\t\t\t\techo "$file" >> not_filled_files.txt\n\t\t\tfi\n\t\tdone < <(find . -name "*.md" -print0)\n\n\t- name: Update Performance in Markdown\n\t\tuses: dltkdgns00/BOJ-action@main\n\t\twith:\n\t\tpath: not_filled_files.txt\n\t\tuser_id: ${author}\n\t\tlanguage_id: ${exNumber}\n\n\t- name: remove not_filled_files.txt\n\t\trun: |\n\t\trm not_filled_files.txt\n\n\t- name: Commit and push changes\n\t\trun: |\n\t\tgit config --local user.email "github-actions[bot]@users.noreply.github.com"\n\t\tgit config --local user.name "github-actions[bot]"\n\t\tgit add .\n\t\tgit status\n\t\tif [[ -n "$(git status --porcelain)" ]]; then\n\t\t\tgit commit -m "Update performance details - [Skip GitHub Action]"\n\t\t\tgit push\n\t\telse\n\t\t\techo "No changes to commit."\n\t\tfi`;

        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        // 폴더 생성 후 폴더 안에 파일 생성
        const uri = vscode.Uri.joinPath(vscode.Uri.file(subFolderPath), fileName);
        await vscode.workspace.fs.writeFile(uri, data);
        console.log("workflow.yml 파일이 생성되었습니다.");
    } catch (error)
    {
        if (error instanceof Error && (error as any).code === "EEXIST")
        {
            console.log('workflow.yml 파일이 이미 존재하므로 생성하지 않습니다.');
            return;
        }
        else
        {
            vscode.window.showErrorMessage('workflow.yml 파일 생성에 실패했습니다.');
            console.log(error);
            return;
        }
    }

}
