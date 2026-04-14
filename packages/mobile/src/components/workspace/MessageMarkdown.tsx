import { Fragment } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

/**
 * Lightweight markdown renderer for chat assistant messages.
 *
 * Supports the subset the AI actually produces:
 *   - `#`, `##`, `###` headings (rendered bold, sized)
 *   - `* ` / `- ` bullet lines
 *   - `1.` ordered list lines
 *   - `**bold**` and `*italic*` inline
 *   - `` `code` `` inline
 *   - `[Dn]` citation tokens highlighted
 *
 * This is deliberately not a full markdown parser — we render what the model
 * emits and keep everything else as plain text.
 */

interface Props {
  content: string;
  color: string;
}

export function MessageMarkdown({ content, color }: Props) {
  const { colors, typography, spacing } = useTheme();
  const lines = content.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        // Headings
        const h = /^(#{1,3})\s+(.*)$/.exec(line);
        if (h) {
          const level = h[1].length;
          const fontSize =
            level === 1 ? typography.fontSize.base
            : level === 2 ? typography.fontSize.sm + 1
            : typography.fontSize.sm;
          return (
            <Text
              key={i}
              style={{
                fontSize,
                fontWeight: typography.fontWeight.bold,
                color,
                marginTop: i === 0 ? 0 : spacing.sm,
                marginBottom: 2,
                lineHeight: fontSize + 6,
              }}
            >
              {renderInline(h[2], color, colors.kxPrimary[400])}
            </Text>
          );
        }

        // Bullets — `* ` or `- `
        const bullet = /^\s*[*-]\s+(.*)$/.exec(line);
        if (bullet) {
          return (
            <View key={i} style={{ flexDirection: 'row', marginTop: 2 }}>
              <Text style={{ color, fontSize: typography.fontSize.sm, lineHeight: 20, marginRight: 6 }}>•</Text>
              <Text style={{ flex: 1, color, fontSize: typography.fontSize.sm, lineHeight: 20 }}>
                {renderInline(bullet[1], color, colors.kxPrimary[400])}
              </Text>
            </View>
          );
        }

        // Ordered list — `1. `
        const ordered = /^\s*(\d+)\.\s+(.*)$/.exec(line);
        if (ordered) {
          return (
            <View key={i} style={{ flexDirection: 'row', marginTop: 2 }}>
              <Text style={{ color, fontSize: typography.fontSize.sm, lineHeight: 20, marginRight: 6 }}>{ordered[1]}.</Text>
              <Text style={{ flex: 1, color, fontSize: typography.fontSize.sm, lineHeight: 20 }}>
                {renderInline(ordered[2], color, colors.kxPrimary[400])}
              </Text>
            </View>
          );
        }

        // Blank line — vertical gap
        if (line.trim() === '') {
          return <View key={i} style={{ height: 6 }} />;
        }

        // Paragraph
        return (
          <Text key={i} style={{ color, fontSize: typography.fontSize.sm, lineHeight: 20 }}>
            {renderInline(line, color, colors.kxPrimary[400])}
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Inline formatting: **bold**, *italic*, `code`, [Dn] citation highlight.
 * Splits by regex and rebuilds a Text tree.
 */
function renderInline(text: string, color: string, accent: string) {
  // Tokenize with a single regex capturing the four inline patterns.
  const re = /(\*\*[^*\n]+\*\*)|(`[^`\n]+`)|(\*[^*\n]+\*)|(\[D\d+(?:,\s*D\d+)*\])/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let idx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      out.push(<Fragment key={idx++}>{text.slice(last, m.index)}</Fragment>);
    }
    const raw = m[0];
    if (m[1]) {
      out.push(<Text key={idx++} style={{ fontWeight: '700', color }}>{raw.slice(2, -2)}</Text>);
    } else if (m[2]) {
      out.push(
        <Text key={idx++} style={{ fontFamily: 'Courier', color }}>{raw.slice(1, -1)}</Text>
      );
    } else if (m[3]) {
      out.push(<Text key={idx++} style={{ fontStyle: 'italic', color }}>{raw.slice(1, -1)}</Text>);
    } else if (m[4]) {
      out.push(
        <Text key={idx++} style={{ color: accent, fontWeight: '600' }}>{raw}</Text>
      );
    }
    last = m.index + raw.length;
  }
  if (last < text.length) {
    out.push(<Fragment key={idx++}>{text.slice(last)}</Fragment>);
  }
  return out;
}
