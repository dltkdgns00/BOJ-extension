import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function showProblem(problemNumber: string, context: vscode.ExtensionContext)
{
  try
  {
    const response = await axios.get(`https://www.acmicpc.net/problem/${problemNumber}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
      responseType: 'arraybuffer', // Response 데이터를 바이너리 데이터로 받도록 설정
    });

    const htmlData = response.data.toString('utf-8'); // 바이너리 데이터를 문자열로 변환

    // Cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(htmlData);

    // 제목 추출
    const title = $('title').text();

    // 본문 추출
    const description = $('#problem_description').text();
    console.log(description);

    // 입력, 출력, 예제 입력, 예제 출력 추출
    const input = $('#problem_input').html();
    const output = $('#problem_output').html();

    // 제한 추출
    const limit = $('#problem_limit').html();

    // 예제 입력, 예제 출력 추출 (배열로 처리)
    const sampleInputs: string[] = [];
    const sampleOutputs: string[] = [];

    let i = 1;
    while (true)
    {
      const sampleInput = $(`#sample-input-${i}`).html();
      const sampleOutput = $(`#sample-output-${i}`).html();

      if (!sampleInput || !sampleOutput)
      {
        break;
      }

      sampleInputs.push(sampleInput);
      sampleOutputs.push(sampleOutput);
      i++;
    }

    // 힌트 추출
    const hint = $('#problem_hint').html();
    console.log(hint);

    // 출처 추출
    const source = $('#source').html();


    // 웹뷰 생성
    const panel = vscode.window.createWebviewPanel(
      'problemPreview',
      `${title}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true, // 스크립트 비활성화
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
        <title>${title}</title>
        <link rel="stylesheet" href="https://ddo7jzca0m2vt.cloudfront.net/css/problem-font.css?version=20230101">
        <link rel="stylesheet" href="https://ddo7jzca0m2vt.cloudfront.net/unify/css/custom.css?version=20230101">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; margin: 0; }
          h1, h2, h3 { margin-top: 30px; }
          h1 { font-size: 28px; }
          h2 { font-size: 24px; }
          h3 { font-size: 20px; }
          code { background-color: #f2f2f2; padding: 2px 4px; border-radius: 4px; }
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
        <h1>${title}</h1>
        <section id="description" class="problem-section">
          <div class="headline">
            <h2>문제</h2>
          </div>
          <div id="problem_description" class="problem-text">
            ${description}
          </div>
        </section>

        <section id="input" class="problem-section">
          <div class="headline">
            <h2>입력</h2>
          </div>
          <div id="problem_input" class="problem-text">
            ${input}
          </div>
        </section>

        <section id="output" class="problem-section">
          <div class="headline">
            <h2>출력</h2>
          </div>
          <div id="problem_output" class="problem-text">
            ${output}
          </div>
        </section>

        ${limit!.trim() !== '' ? `
          <section id="limit" class="problem-section">
            <div class="headline">
              <h2>제한</h2>
            </div>
            <div id="problem_limit" class="problem-text">
              ${limit}
            </div>
          </section>
          ` : '<div id="limit" class="problem-section hidden"></div>'
      }

        <section id="sample-IOs" class="problem-section">
            ${sampleInputs.map((input, index) => `
              <div class="sample-container">
                <div class="sample-box">
                  <h2>예제 입력 ${index + 1}</h3>
                  <pre class="sampledata">${input}</pre>
                </div>
                <div class="sample-box">
                  <h2>예제 출력 ${index + 1}</h3>
                  <pre class="sampledata">${sampleOutputs[index]}</pre>
                </div>
              </div>
            `).join('')}
        </section>

        ${hint!.trim() !== '' ? `
          <section id="hint" class="problem-section">
            <div class="headline">
              <h2>힌트</h2>
            </div>
            <div id="problem_hint" class="problem-text">
              ${hint}
            </div>
          </section>
          ` : '<div id="hint" class="problem-section hidden"></div>'
      }

        <section id="source" class="problem-section">
          <div id="source" class="problem-text">
            ${source}
          </div>
        </section>
      </body>
      </html>
    `;
  } catch (error)
  {
    vscode.window.showErrorMessage('Failed to fetch the problem: ' + error);
  }
}

// 웹뷰에 전달할 테마 정보를 포함한 메시지를 생성하는 함수
function createThemeMessage()
{
  const currentTheme = vscode.window.activeColorTheme.kind;
  return { theme: currentTheme };
}

function getThemeStyles()
{
  // 현재 테마를 가져와서 해당 테마에 따른 스타일을 반환하는 함수
  const currentTheme = vscode.window.activeColorTheme.kind;
  switch (currentTheme)
  {
    case vscode.ColorThemeKind.Light:
      return `
        pre {
          background-color: #f2f2f2;
          color: black;
          font-size: 14px;
        }
      `;
    case vscode.ColorThemeKind.Dark:
      return `
        pre {
          background-color: #2e2e2e;
          color: white;
          font-size: 14px;
        }
      `;
    default:
      return '';
  }
}