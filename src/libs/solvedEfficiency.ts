import * as vscode from 'vscode';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function solvedEfficiency(problemNumber: string, context: vscode.ExtensionContext)
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

    const response = await axios.get(`https://www.acmicpc.net/status?problem_id=${problemNumber}&user_id=${author}&language_id=${exNumber}&result_id=4`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        },
        responseType: 'arraybuffer', // Response 데이터를 바이너리 데이터로 받도록 설정
    });

    const htmlData = response.data.toString('utf-8'); // 바이너리 데이터를 문자열로 변환

    // Cheerio를 사용하여 HTML 파싱
    const $ = cheerio.load(htmlData);

    // 메모리 추출
    const memory = $('#solution-47488616 > td.memory').text();
    console.log(memory);


    // 시간 추출
    const time = $('#solution-47488616 > td.time').text();
    console.log(time);
}