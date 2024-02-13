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
		panel.webview.html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <base href="https://www.acmicpc.net"> <!-- base url 설정 -->
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'">
        <title>${title}</title>
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
          ${title}
        </h1>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <h3 style="display:inline">
          <img src="${tier.svg}" class="solvedac-tier">
          <span>${tier.name}</span>
        </h3>
        <br>
        <table>
          ${sp.info}
        </table>
        <section id="description" class="problem-section">
          <div class="headline">
            <h2>문제</h2>
          </div>
          <div id="problem_description" class="problem-text">
            ${sp.description}
          </div>
        </section>

        <section id="input" class="problem-section">
          <div class="headline">
            <h2>입력</h2>
          </div>
          <div id="problem_input" class="problem-text">
            ${sp.input}
          </div>
        </section>

        <section id="output" class="problem-section">
          <div class="headline">
            <h2>출력</h2>
          </div>
          <div id="problem_output" class="problem-text">
            ${sp.output}
          </div>
        </section>

        ${
			sp.limit!.trim() !== ""
				? `
          <section id="limit" class="problem-section">
            <div class="headline">
              <h2>제한</h2>
            </div>
            <div id="problem_limit" class="problem-text">
              ${sp.limit}
            </div>
          </section>
          `
				: '<div id="limit" class="problem-section hidden"></div>'
		}

          <section id="sample-IOs" class="problem-section">
          ${sp
				.sampleInputs!.map(
					(input, index) => `
            <div class="sample-container">
              <div class="sample-box">
                <h2>예제 입력 ${index + 1}</h2>
                <pre class="sampledata">${input}</pre>
              </div>
              <div class="sample-box">
                <h2>예제 출력 ${index + 1}</h2>
                <pre class="sampledata">${sp.sampleOutputs![index]}</pre>
              </div>
            </div>
            ${
				sp.sampleExplains![index] === undefined
					? ""
					: `${sp.sampleExplains![index]}`
			}
          `
				)
				.join("")}
        </section>
    

        ${
			sp.hint!.trim() !== ""
				? `
          <section id="hint" class="problem-section">
            <div class="headline">
              <h2>힌트</h2>
            </div>
            <div id="problem_hint" class="problem-text">
              ${sp.hint}
            </div>
          </section>
          `
				: '<div id="hint" class="problem-section hidden"></div>'
		}

        ${
			sp.source !== null
				? `
        <section id="source" class="problem-section">
          <div id="source" class="problem-text">
            ${sp.source}
          </div>
        </section>`
				: '<div id="source" class="problem-section hidden"></div>'
		}

      </body>
      </html>
    `;
		console.log(panel.webview.cspSource);
	} catch (error) {
		vscode.window.showErrorMessage("Failed to fetch the problem: " + error);
	}
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
