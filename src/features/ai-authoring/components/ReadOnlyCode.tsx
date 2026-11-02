import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";

interface ReadOnlyCodeProps {
    code: string;
    label: string;
}

export function ReadOnlyCode({ code, label }: ReadOnlyCodeProps) {
    return (
        <div
            role="region"
            aria-label={`${label} (read only)`}
            className="overflow-hidden rounded-md border border-input"
        >
            <CodeMirror
                value={code}
                extensions={[python()]}
                editable={false}
                readOnly
                theme="light"
                minHeight="140px"
                basicSetup={{ lineNumbers: true, foldGutter: false }}
            />
        </div>
    );
}
