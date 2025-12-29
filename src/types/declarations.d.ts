import { ComponentType, CSSProperties, ReactNode } from 'react';

declare module 'react-syntax-highlighter' {
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: { [key: string]: CSSProperties };
    children?: ReactNode;
    customStyle?: CSSProperties;
    codeTagProps?: React.HTMLAttributes<HTMLElement>;
    useInlineStyles?: boolean;
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    lineNumberStyle?: CSSProperties | ((lineNumber: number) => CSSProperties);
    wrapLines?: boolean;
    lineProps?: React.HTMLAttributes<HTMLElement> | ((lineNumber: number) => React.HTMLAttributes<HTMLElement>);
    renderer?: (props: any) => ReactNode;
    PreTag?: keyof JSX.IntrinsicElements | ComponentType<any>;
    CodeTag?: keyof JSX.IntrinsicElements | ComponentType<any>;
    [key: string]: any; // Allow other props
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const vscDarkPlus: { [key: string]: CSSProperties };
  export const atomDark: { [key: string]: CSSProperties };
  // Add others as needed
}
