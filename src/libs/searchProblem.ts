import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function searchProblem(problemNumber: string, context: vscode.ExtensionContext): Promise<{ title: string, info: string | null, description: string, input: string | null, output: string | null, limit: string | null, sampleInputs: string[] | null, sampleOutputs: string[] | null, hint: string | null, source: string | null }>
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

    const baseURL = 'https://www.acmicpc.net';

    $('img').each((index, element) =>
    {
        const src = $(element).attr('src');
        if (src && !src.startsWith('http') && baseURL)
        {
            // base URL과 img 요소의 src 속성을 조합하여 절대 URL로 변환
            $(element).attr('src', baseURL + src);
        }
    });

    // 제목 추출
    const title = $('#problem_title').text();

    // 문제 정보 추출
    const info = $('#problem-info').html();

    // 본문 추출
    const description = $('#problem_description').html()!.replace(/\t/g, '');

    // 입력, 출력, 예제 입력, 예제 출력 추출
    const input = $('#problem_input > p').html()!.replace(/\t/g, '');
    const output = $('#problem_output > p').html()!.replace(/\t/g, '');

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

    // 출처 추출
    const source = $('#source').html();

    return { title, info, description, input, output, limit, sampleInputs, sampleOutputs, hint, source };
}