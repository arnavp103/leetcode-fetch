#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import fetch from "node-fetch";
const program = new Command();
program
    .name("leetcode-fetch")
    .version("0.2.4")
    .description("Fetch LeetCode problems and save them locally")
    .argument("[problem-link]", "Optional link to a specific LeetCode problem in the format https://leetcode.com/problems/problem-name/")
    .option("-l, --lang <language>", "Programming language for the code snippet", "python3")
    .option("-s, --slug", "Use the problem's slug as the filename instead of its ID")
    .option("-b, --bare", "Only include problem title, difficulty, and starter snippet");
program.parse(process.argv);
const LEETCODE_API_URL = "https://leetcode.com/graphql";
const PROBLEM_QUERY = `
  query getQuestionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      topicTags {
        name
      }
      codeSnippets {
        lang
        langSlug
        code
      }
    }
  }
`;
const DAILY_PROBLEM_QUERY = `
  query getDailyProblem {
    activeDailyCodingChallengeQuestion {
      question {
        questionId
		frontendQuestionId: questionFrontendId
        title
        titleSlug
        content
        difficulty
        topicTags {
          name
        }
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }
  }
`;
main();
async function main() {
    const problemLink = program.args[0];
    const language = normalizeLanguage(program.opts().lang);
    const useSlug = program.opts().slug;
    const bare = program.opts().bare;
    try {
        const problem = await getProblem(problemLink);
        const fileName = `${useSlug ? problem.titleSlug : problem.frontendQuestionId}.${getFileExtension(language)}`;
        let fileContent = `${problem.frontendQuestionId} ${problem.title}
${problem.link} - ${problem.difficulty}

`;
        if (!bare) {
            fileContent += `${stripHtmlTagsAndDecode(problem.content)}\n`;
        }
        fileContent += `${problem.codeSnippets.find(snippet => snippet.langSlug === language)
            ?.code || `// No ${language} code available`}`;
        // check if that file already exists
        if (fs.existsSync(fileName)) {
            console.log(`File already exists: ${fileName}`);
            return;
        }
        fs.writeFileSync(fileName, fileContent);
        console.log(`File created: ${fileName}`);
    }
    catch (error) {
        console.error("Error:", error.message);
    }
}
async function getProblem(problemLink) {
    let query, variables;
    if (problemLink !== undefined) {
        let titleSlug = "";
        // if problem has /description/ 
        // https://leetcode.com/problems/toeplitz-matrix/description/
        // strip the /description/ part
        if (problemLink.includes("/description")) {
            titleSlug = problemLink.split("/description")[0].split("/problems/")[1];
        }
        else {
            titleSlug = problemLink.split("/problems/")[1];
        }
        query = PROBLEM_QUERY;
        variables = { titleSlug };
    }
    else {
        query = DAILY_PROBLEM_QUERY;
        variables = {};
    }
    const response = await fetch(LEETCODE_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, variables })
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const problem = problemLink
        ? result.data.question
        : result.data.activeDailyCodingChallengeQuestion.question;
    return {
        ...problem,
        link: problemLink || `https://leetcode.com/problems/${problem.titleSlug}/`
    };
}
// turns js and javascript into js for example
function normalizeLanguage(language) {
    const languageMap = {
        js: "javascript",
        ts: "typescript",
        py: "python",
        py3: "python3",
        "c++": "cpp",
        cs: "csharp",
        "c#": "csharp",
        kt: "kotlin",
        rkt: "racket",
        go: "golang",
        rb: "ruby",
        rs: "rust",
        exs: "elixir",
        erl: "erlang"
    };
    return languageMap[language.toLowerCase()] || language;
}
function getFileExtension(language) {
    const extensionMap = {
        c: "c",
        cpp: "cpp",
        csharp: "cs",
        golang: "go",
        java: "java",
        python3: "py",
        python: "py",
        javascript: "js",
        typescript: "ts",
        ruby: "rb",
        swift: "swift",
        scala: "scala",
        kotlin: "kt",
        racket: "rkt",
        rust: "rs",
        php: "php",
        sql: "sql",
        erlang: "erl",
        elixir: "exs",
        dart: "dart"
    };
    return extensionMap[language] || "txt";
}
function stripHtmlTagsAndDecode(html) {
    // Lookup table for HTML escape codes
    const htmlEntities = {
        "&quot;": '"',
        "&apos;": "'",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&#39;": "'",
        "#39;": "'",
        "#34;": '"',
        "&nbsp;": " ",
        "&copy;": "©",
        "&reg;": "®",
        "&euro;": "€",
        "&pound;": "£",
        "&yen;": "¥",
        "&cent;": "¢",
        "&sect;": "§",
        "&deg;": "°",
        "&para;": "¶",
        "&hellip;": "…",
        "&ldquo;": "“",
        "&rdquo;": "”",
        "&lsquo;": "‘",
        "&rsquo;": "’",
        "&ndash;": "–",
        "&mdash;": "—",
        "&lsaquo;": "‹",
        "&rsaquo;": "›",
        "&laquo;": "«",
        "&raquo;": "»",
        "&frac14;": "¼",
        "&frac12;": "½",
        "&frac34;": "¾",
        "&times;": "×",
        "&divide;": "÷"
    };
    // Replace HTML tags
    let text = html.replace(/<[^>]*>/g, "");
    // Replace HTML escape codes using the lookup table
    return text.replace(/&[^;]+;/g, match => htmlEntities[match] || match);
}
