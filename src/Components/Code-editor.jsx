import React, { useState, useEffect } from "react";
import MonacoEditor, { loader } from "@monaco-editor/react";
import "../Styles/Code-editor.scss";
import Button from "./UI/Button/Button";
import {
  pythonKeywords,
  pythonBuiltInFunctions,
  pythonModules,
  pythonDataTypes,
  pythonExceptions,
  pythonClasses,
} from "../Const/pythonHighlightWords";

const CodeEditor = () => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [pyodideInstance, setPyodideInstance] = useState(null);

  // Подключаем библиотеку Monaco и настраиваем автодополнение
  useEffect(() => {
    loader.init().then((monacoInstance) => {
      monacoInstance.languages.register({ id: "python" });

      monacoInstance.languages.setMonarchTokensProvider("python", {
        tokenizer: {
          root: [
            [
              /\b(def|class|import|from|if|else|elif|while|for|return)\b/,
              "keyword",
            ],
            [/\b(True|False|None)\b/, "constant"],
            [/\b(self)\b/, "variable"],
            [/".*?"/, "string"],
            [/\d+/, "number"],
          ],
        },
      });

      monacoInstance.languages.registerCompletionItemProvider("python", {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            ...pythonKeywords,
            ...pythonBuiltInFunctions,
            ...pythonModules,
            ...pythonDataTypes,
            ...pythonExceptions,
            ...pythonClasses,
          ].map((item) => ({
            label: item,
            kind: monacoInstance.languages.CompletionItemKind.Text,
            insertText: item,
          }));

          return { suggestions };
        },
      });
    });
  }, []);

  // Загружаем Pyodide для выполнения Python-кода
  useEffect(() => {
    const loadPyodide = async () => {
      const pyodide = await window.loadPyodide();
      setPyodideInstance(pyodide);
    };

    loadPyodide().catch(console.error);
  }, []);

  // Выполнение Python-кода через Pyodide
  const executePythonCode = async (code) => {
    if (!pyodideInstance) return;

    try {
      await pyodideInstance.runPythonAsync(`
        import sys
        from io import StringIO
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        try:
          exec(${JSON.stringify(code)})
        except Exception as e:
          mystdout.write(str(e))
        sys.stdout = old_stdout
        mystdout.getvalue()
      `);

      const outputResult = pyodideInstance.runPython(`
        mystdout.getvalue()
      `);

      setOutput(outputResult);
    } catch (error) {
      setOutput(`Ошибка выполнения Python: ${error.message}`);
    }
  };

  // Выполнение JavaScript через iframe, с обработкой ошибок
  const executeJavaScriptCode = (code) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    iframe.contentWindow.console.log = (message) => {
      setOutput((prevOutput) => prevOutput + message + "\n");
    };

    window.addEventListener("message", (event) => {
      if (event.data.type === "error") {
        setOutput(`Ошибка выполнения JS: ${event.data.message}`);
      }
    });

    const script = iframe.contentWindow.document.createElement("script");

    try {
      new Function(code); // Проверяем синтаксис
      script.textContent = `
        try {
          ${code}
        } catch (error) {
          window.parent.postMessage({ type: 'error', message: error.message }, '*');
        }
      `;
    } catch (e) {
      setOutput(`Ошибка синтаксиса в JS: ${e.message}`);
      iframe.remove();
      return;
    }

    script.onload = () => {
      setOutput((prevOutput) => prevOutput + "Выполнение успешно\n");
    };

    iframe.contentWindow.document.body.appendChild(script);
    iframe.remove();
  };

  // Обработка кнопки "Run"
  const handleRun = () => {
    if (language === "python") {
      executePythonCode(code);
    } else if (language === "javascript") {
      setOutput("");
      executeJavaScriptCode(code);
    }
  };

  // Очистка кода и вывода
  const handleClear = () => {
    setCode("");
    setOutput("");
  };

  return (
    <div className="code-editor">
      <div className="task-description">
        <h3>Описание задачи:</h3>
        <p>
          Напишите и выполните код на выбранном языке программирования. Вы
          можете выбрать между JavaScript и Python. Нажмите "Run", чтобы увидеть
          результат выполнения, нажмите "Clear", чтобы очистить поля ввода и
          вывода.
        </p>
      </div>
      <div className="language-selector">
        <label htmlFor="language">Выберите язык: </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
      </div>
      <MonacoEditor
        language={language}
        value={code}
        onChange={(value) => setCode(value)}
        theme="vs-dark"
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordBasedSuggestions: true,
        }}
      />
      <div className="button-box">
        <Button type="run" onClick={handleRun} />
        <Button type="del" onClick={handleClear} />
      </div>

      {output && (
        <div className="output">
          <h3>Результат выполнения:</h3>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
