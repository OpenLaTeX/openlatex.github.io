export const parseLatexLogs = (logs) => {
  if (!logs) return [];

  const lines = logs.split('\n');
  const errors = [];
  let currentError = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('!')) {
      if (currentError) {
        errors.push(currentError);
      }
      currentError = {
        type: 'error',
        message: line.substring(1).trim(),
        line: null,
        context: []
      };
    } else if (currentError && line.match(/^l\.(\d+)/)) {
      const match = line.match(/^l\.(\d+)\s*(.*)/);
      currentError.line = parseInt(match[1]);
      currentError.context.push(match[2]);
    } else if (currentError && line.trim()) {
      currentError.context.push(line.trim());
    }
  }

  if (currentError) {
    errors.push(currentError);
  }

  return errors;
};
