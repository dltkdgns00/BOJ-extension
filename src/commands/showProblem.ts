import * as vscode from "vscode";
import { searchProblem } from "../libs/searchProblem";
import { tierAxios } from "../libs/tierAxios";

export async function showProblem(
	problemNumber: string,
	context: vscode.ExtensionContext
) {
	try {
		const sp = await searchProblem(problemNumber, context);
		const tier = await tierAxios(problemNumber);

		const title = `${problemNumber}번: ${sp.title}`;

		// 웹뷰 생성
		const panel = vscode.window.createWebviewPanel(
			"problemPreview",
			`${title}`,
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
			}
		);

		// 웹뷰에 백준 온라인 저지 스타일과 문제 데이터 출력
		panel.webview.html = generateHtml(sp, tier, context, panel, problemNumber);

		// 웹뷰 생성 후 메시지 수신 처리 추가
		panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.command) {
					case "runTestCase":
						// 문제 번호를 전역 상태로 저장
						context.globalState.update("currentProblemNumber", problemNumber);
						vscode.commands.executeCommand("BOJ-EX.runTestCase", problemNumber);
						break;
					case "submitProblem":
						vscode.commands.executeCommand(
							"BOJ-EX.submitProblem",
							message.problemNumber
						);
						break;
				}
			},
			undefined,
			context.subscriptions
		);
	} catch (error) {
		vscode.window.showErrorMessage("Failed to fetch the problem: " + error);
	}
}

// HTML 생성 함수에서 예제 입력과 예제 출력 부분을 찾아 테스트 버튼 추가
function generateHtml(
	problemData: any,
	tier: any,
	context: vscode.ExtensionContext,
	panel: vscode.WebviewPanel,
	problemNumber: string
): string {
	let htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <base href="https://www.acmicpc.net"> <!-- base url 설정 -->
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'">
        <title>${problemNumber}번: ${problemData.title}</title>
        <link rel="stylesheet" href="https://ddo7jzca0m2vt.cloudfront.net/css/problem-font.css?version=20230101">
        <link rel="stylesheet" href="https://ddo7jzca0m2vt.cloudfront.net/unify/css/custom.css?version=20230101">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; margin: 0; }
          h1, h2, h3 { margin-top: 30px; }
          h1 { font-size: 28px; }
          h2 { font-size: 24px; }
          h3 { font-size: 20px; }
          ${getThemeStyles()}
          .problem-section { margin-bottom: 30px; }
          .problem-text p { margin: 0; }
          .problem-text a { color: #007bff; }
          .problem-io { margin-top: 20px; }
          .problem-io h3 { font-size: 20px; }
          .sample-container {
            display: flex;
            gap: 16px; /* 예제와 예제 사이의 간격 설정 (원하는 크기로 조정) */
          }
          .sample-box {
            flex: 1; /* 박스가 꽉 차도록 설정 */
          }
          .hidden {
            display: none;
          }
          .button-container {
            margin-top: 15px;
            display: flex;
            gap: 10px;
          }
          .submit-button {
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .submit-button:hover {
            background-color: #45a049;
          }
        </style>
        <script>
          function updateTheme() {
            const theme = ${JSON.stringify(createThemeMessage())};
            vscode.postMessage(theme);
          }
          function getLocalResourceUri(resourcePath) {
            const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, resourcePath));
            const srcUri = panel.webview.asWebviewUri(onDiskPath);
            return srcUri;
          }
        </script>
        <script type="text/x-mathjax-config">
  MathJax.Hub.Config({
    tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}
  });
</script>
<script src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
      </head>
      <body>
        <h1 style="display:inline">
          ${problemNumber}번: ${problemData.title}
        </h1>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <h3 style="display:inline">
          <img src="${tier.svg}" class="solvedac-tier">
          <span>${tier.name}</span>
        </h3>
        <br>
        <table>
          ${problemData.info}
        </table>
        <section id="description" class="problem-section">
          <div class="headline">
            <h2>문제</h2>
          </div>
          <div id="problem_description" class="problem-text">
            ${problemData.description}
          </div>
        </section>

        <section id="input" class="problem-section">
          <div class="headline">
            <h2>입력</h2>
          </div>
          <div id="problem_input" class="problem-text">
            ${problemData.input}
          </div>
        </section>

        <section id="output" class="problem-section">
          <div class="headline">
            <h2>출력</h2>
          </div>
          <div id="problem_output" class="problem-text">
            ${problemData.output}
          </div>
        </section>

        ${
					problemData.limit!.trim() !== ""
						? `
          <section id="limit" class="problem-section">
            <div class="headline">
              <h2>제한</h2>
            </div>
            <div id="problem_limit" class="problem-text">
              ${problemData.limit}
            </div>
          </section>
          `
						: '<div id="limit" class="problem-section hidden"></div>'
				}

          <section id="sample-IOs" class="problem-section">
          ${problemData
						.sampleInputs!.map(
							(input, index) => `
            <div class="test-case-button-container">
              <button id="run-test-case" class="run-test-button">테스트 케이스 실행</button>
              <button id="submit-problem" class="submit-button">제출 페이지로 이동</button>
            </div>
            <div class="sample-container">
              <div class="sample-box">
                <h2>예제 입력 ${index + 1}</h2>
                <pre class="sampledata">${input}</pre>
              </div>
              <div class="sample-box">
                <h2>예제 출력 ${index + 1}</h2>
                <pre class="sampledata">${
									problemData.sampleOutputs![index]
								}</pre>
              </div>
            </div>
            ${
							problemData.sampleExplains![index] === undefined
								? ""
								: `${problemData.sampleExplains![index]}`
						}
          `
						)
						.join("")}
        </section>
    

        ${
					problemData.hint!.trim() !== ""
						? `
          <section id="hint" class="problem-section">
            <div class="headline">
              <h2>힌트</h2>
            </div>
            <div id="problem_hint" class="problem-text">
              ${problemData.hint}
            </div>
          </section>
          `
						: '<div id="hint" class="problem-section hidden"></div>'
				}

        ${
					problemData.source !== null
						? `
        <section id="source" class="problem-section">
          <div id="source" class="problem-text">
            ${problemData.source}
          </div>
        </section>`
						: '<div id="source" class="problem-section hidden"></div>'
				}

      </body>
      </html>
    `;

	// 스타일 추가
	const additionalStyle = `
    <style>
      .test-case-button-container {
        margin: 15px 0;
        text-align: right;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .run-test-button {
        background-color: #28a745;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .run-test-button:hover {
        background-color: #218838;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      .run-test-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .run-test-button::before {
        content: "▶";
        font-size: 12px;
        color: white;
      }
      .submit-button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .submit-button:hover {
        background-color: #0069d9;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      .submit-button:active {
        transform: translateY(1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .submit-button::before {
        content: "↗";
        font-size: 12px;
        color: white;
      }
    </style>
  `;

	htmlContent = htmlContent.replace("</head>", `${additionalStyle}</head>`);

	// 버튼 클릭 이벤트 스크립트 추가
	const script = `
    <script>
      const vscode = acquireVsCodeApi();
      document.querySelectorAll('.run-test-button').forEach(button => {
        button.addEventListener('click', () => {
          vscode.postMessage({ 
            command: 'runTestCase'
          });
        });
      });
      document.querySelectorAll('.submit-button').forEach(button => {
        button.addEventListener('click', () => {
          vscode.postMessage({
            command: 'submitProblem',
            problemNumber: '${problemNumber}'
          });
        });
      });
    </script>
  `;

	htmlContent = htmlContent.replace("</body>", `${script}</body>`);

	return htmlContent;
}

// 웹뷰에 전달할 테마 정보를 포함한 메시지를 생성하는 함수
function createThemeMessage() {
	const currentTheme = vscode.window.activeColorTheme.kind;
	return { theme: currentTheme };
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
