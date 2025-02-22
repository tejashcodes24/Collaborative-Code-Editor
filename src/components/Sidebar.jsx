import React, { useState } from 'react';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { Code2 } from 'lucide-react';
import { SiJavascript, SiPython, SiHtml5, SiCss3, SiCplusplus, SiRust, SiGo } from 'react-icons/si';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// Import from editorSlice instead of fileSystemSlice
import { setCurrentFile, setFileContent } from '../redux/slices/editorSlice';

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return <SiJavascript className="text-yellow-400" />;
    case 'py':
      return <SiPython className="text-blue-500" />;
    case 'html':
      return <SiHtml5 className="text-orange-500" />;
    case 'css':
      return <SiCss3 className="text-blue-300" />;
    case 'cpp':
    case 'c':
      return <SiCplusplus className="text-blue-600" />;
    case 'rs':
      return <SiRust className="text-orange-600" />;
    case 'go':
      return <SiGo className="text-blue-400" />;
    default:
      return <Code2 className="text-gray-400" />;
  }
};

// Add the findFileInFolder helper function
const findFileInFolder = (items, targetFileId) => {
  for (const item of items) {
    if (item.id === targetFileId) {
      return item;
    }
    if (item.type === 'folder' && item.items) {
      const found = findFileInFolder(item.items, targetFileId);
      if (found) return found;
    }
  }
  return null;
};

const FileTreeItem = ({ 
  item, 
  level = 0, 
  onFileClick, 
  expandedFolders, 
  toggleFolder 
}) => {
  const isFolder = item.type === 'folder';
  const isExpanded = expandedFolders.has(item.id);

  return (
    <div className={`pl-${level * 3}`}>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-700 rounded cursor-pointer"
        onClick={() => isFolder ? toggleFolder(item.id) : onFileClick(item.id)}
      >
        <span className="flex items-center">
          {isFolder ? (
            isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          {isFolder ? (
            isExpanded ? <FaFolderOpen className="text-yellow-400" /> : <FaFolder className="text-yellow-400" />
          ) : (
            getFileIcon(item.name)
          )}
          <span>{item.name}</span>
        </span>
      </div>

      {isFolder && isExpanded && item.items && (
        <div>
          {item.items.map((subItem) => (
            <FileTreeItem
              key={subItem.id}
              item={subItem}
              level={level + 1}
              onFileClick={onFileClick}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { currentFolder } = useSelector((state) => state.fileSystem);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const handleFileClick = (fileId) => {
    if (!currentFolder || !fileId) return;
    
    const file = findFileInFolder(currentFolder.items, fileId);
    if (file) {
      dispatch(setCurrentFile(file));
      dispatch(setFileContent({ 
        fileId: file.id, 
        content: file.content || '' 
      }));
      navigate(`/editor/${currentFolder.id}/${fileId}`);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="h-full bg-[#031d38] border-r border-[#1E4976] text-white">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Files</h2>
        {currentFolder?.items?.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            onFileClick={handleFileClick}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 
