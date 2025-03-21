import React, { useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
import { setFileContent } from '../redux/slices/editorSlice';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { debounce } from 'lodash';
import { Code2 } from 'lucide-react';

const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'cpp':
    case 'c':
      return 'cpp';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    default:
      return 'plaintext';
  }
};

const CodeEditor = () => {
  const editorRef = useRef(null);
  const dispatch = useDispatch();
  const { currentFile, activeFiles, selectedTheme } = useSelector((state) => state.editor);
  const { currentFolder } = useSelector((state) => state.fileSystem);
  
  const currentContent = currentFile ? activeFiles[currentFile.id] : '';
  const editorLanguage = currentFile ? getLanguageFromFileName(currentFile.name) : 'plaintext';

  const findFileInFolder = (items, fileId) => {
    for (const item of items) {
      if (item.id === fileId) {
        return { file: item, folderId: currentFolder.id };
      }
      if (item.type === 'folder' && item.items) {
        const result = findFileInFolder(item.items, fileId);
        if (result) return result;
      }
    }
    return null;
  };
  
  const debouncedUpdate = useCallback(
    debounce(async (fileId, content) => {
      if (!fileId || !currentFolder) return;

      try {
        const folderRef = doc(db, "playgrounds", currentFolder.id);
        const folderSnap = await getDoc(folderRef);
        
        if (folderSnap.exists()) {
          const folderData = folderSnap.data();
          
          const updateItems = (items) => {
            return items.map(item => {
              if (item.id === fileId) {
                return { 
                  ...item, 
                  content: content,
                  updatedAt: new Date().toISOString()
                };
              }
              if (item.type === 'folder' && item.items) {
                return { ...item, items: updateItems(item.items) };
              }
              return item;
            });
          };

          const updatedItems = updateItems(folderData.items);
          await updateDoc(folderRef, { 
            items: updatedItems 
          });
          
          console.log('File saved successfully:', fileId);
        }
      } catch (error) {
        console.error("Error updating file content:", error);
      }
    }, 1000),
    [currentFolder]
  );

  const handleEditorChange = (value) => {
    if (!currentFile || !currentFolder) return;
    
    dispatch(setFileContent({ 
      fileId: currentFile.id, 
      content: value 
    }));
    debouncedUpdate(currentFile.id, value);
  };

  if (!currentFile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
      <div className="text-center space-y-4">
        <Code2 size={48} className="mx-auto text-gray-400" />
        <p className="text-lg">Select a file to start editing</p>
        <p className="text-sm opacity-60">Your code will appear here</p>
      </div>
    </div>
  );
}

  return (
      <div className="w-full h-full">
        {!currentFile ? (
          <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-gray-400">
            <div className="text-center space-y-4">
              <Code2 size={48} className="mx-auto text-gray-400" />
              <p className="text-lg">Select a file to start editing</p>
              <p className="text-sm opacity-60">Your code will appear here</p>
            </div>
          </div>
      ) : (
        <Editor
          height="100%"
          defaultLanguage={editorLanguage}
          language={editorLanguage}
          value={currentContent}
          theme={selectedTheme}
          onChange={handleEditorChange}
          onMount={(editor) => {
            editorRef.current = editor;
            setTimeout(() => editor.layout(), 100);
          }}
          options={{
            fontSize: 19,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            formatOnPaste: false,
            formatOnType: false,
            cursorStyle: 'line',
            cursorBlinking: 'blink',
          }}
          key={currentFile.id}
        />
      )}
    </div>
  );
};

export default CodeEditor;
