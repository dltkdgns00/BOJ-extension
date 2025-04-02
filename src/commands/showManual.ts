import * as vscode from "vscode";

export function showManual(context: vscode.ExtensionContext) {
	// 웹뷰 생성
	const panel = vscode.window.createWebviewPanel(
		"preview",
		`BOJ-extension 사용법`,
		vscode.ViewColumn.Two
	);

	// 이미지 폴더 경로를 가져오기
	const extensionUri =
		vscode.extensions.getExtension("dltkdgns00.boj-ex")!.extensionUri;
	const imagesFolderPath = vscode.Uri.joinPath(extensionUri, "images");

	panel.webview.html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BOJ-extension 사용법</title>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; margin: 0; }
h1, h2, h3 { margin-top: 30px; }
h1 { font-size: 28px; }
h2 { font-size: 24px; }
h3 { font-size: 20px; }
${getThemeStyles()}
</style>
</head>
<body>
<h1 id="boj-extension-">BOJ-extension 사용법</h1>
<h2 id="-">확장 사용전 준비</h2>
<ol>
<li>vscode의 확장 설정에 BOJ에서 자신이 사용하는 아이디를 입력하고, BOJ에서 자신이 주로 사용하는 언어의 &quot;확장자&quot;(ex: c++ -&gt; cpp, python -&gt; py)를 입력합니다.
<img src="${panel.webview.asWebviewUri(
		vscode.Uri.joinPath(imagesFolderPath, "EX_settings.png")
	)}"></li>
<li>자신이 푼 문제들을 정리중인 깃허브 레포지토리의 Settings에 들어가서 Secrets and variables설정을 해줍니다. Github Action을 사용하기 위함입니다.
<img src="${panel.webview.asWebviewUri(
		vscode.Uri.joinPath(imagesFolderPath, "GH_Secrets.png")
	)}">
<img src="${panel.webview.asWebviewUri(
		vscode.Uri.joinPath(imagesFolderPath, "GH_TOKEN.png")
	)}">
  ※ <code>GH_TOKEN</code>은 깃허브에서 발급받은 토큰을 입력합니다. 토큰 발급 방법은 <a href="https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token">여기</a>를 참고해주세요.<br> ※ <code>BOJ: Push To Github</code> 커맨드를 사용하면 자동으로 Github Action을 위한 workflow.yml파일이 생성되고, Github 레포지토리에 푸시됩니다.</li>
</ol>
<h2 id="github-action">Github Action</h2>
<p><a href="https://github.com/dltkdgns00/BOJ-action">Github Action for BOJ-extension</a> made by dltkdgns00<br>이 Github 레포지토리는 BOJ-extension을 위한 Github Action을 제공합니다.<br>BOJ-extension에서 자동으로 생성하는 workflow.yml파일을 사용하면 자신의 Github 레포지토리에 자신이 푼 문제들의 <code>README.md</code>파일에 백준 온라인 저지에 제출한 본인의 코드의 성능요약을 추가할 수 있습니다.</p>
<h2 id="-">사용법</h2>
<p><img src="${panel.webview.asWebviewUri(
		vscode.Uri.joinPath(imagesFolderPath, "../BOJ-extension.gif")
	)}"></p>
<ol>
<li>vscode의 사이드 바에서 BOJ-extension 아이콘을 클릭합니다.</li>
<li>버튼을 클릭합니다.<ul>
<li><code>📝 문제 보기</code><ul>
<li>백준 온라인 저지 문제 번호를 입력하면 해당 문제가 열립니다.</li>
</ul>
</li>
<li><code>➕ 문제 생성</code><ul>
<li>백준 온라인 저지 문제 번호를 입력하면 해당 문제의 제목을 파일명으로 하는 파일이 생성되고, 자동으로 헤더가 생성된 후, 문제가 열립니다.</li>
</ul>
</li>
<li><code>✏️ 헤더 코멘트 삽입</code><ul>
<li>백준 온라인 저지 문제 번호를 입력하면 해당 파일의 정보를 담은 아름다운 헤더가 생성됩니다.</li>
</ul>
</li>
<li><code>🚀 GitHub에 푸시</code><ul>
<li>현재 워크스페이스에 Github Action을 위한 <code>workflow.yml</code>파일을 생성하고 깃허브 레포지토리에 푸시합니다.</li>
</ul>
</li>
<li><code>⚙️ 워크플로우 생성</code><ul>
<li>Github Action을 위한 <code>workflow.yml</code>파일을 생성합니다.</li>
</ul>
</li>
<li><code>📚 매뉴얼 보기</code><ul>
<li>BOJ-extension의 매뉴얼을 엽니다.</li>
</ul>
</li>
</ul>
</li>
</ol>
</body>
</html>
`;
}

function getThemeStyles() {
	// 현재 테마를 가져와서 해당 테마에 따른 스타일을 반환하는 함수
	const currentTheme = vscode.window.activeColorTheme.kind;
	switch (currentTheme) {
		case vscode.ColorThemeKind.Light:
			return `
        code { background-color: #f2f2f2; padding: 2px 4px; border-radius: 4px; }
        pre {
          background-color: #f2f2f2;
          color: black;
          font-size: 14px;
        }
      `;
		case vscode.ColorThemeKind.Dark:
			return `
        code { background-color: #2e2e2e; padding: 2px 4px; border-radius: 4px; }
        pre {
          background-color: #2e2e2e;
          color: white;
          font-size: 14px;
        }
      `;
		default:
			return "";
	}
}
