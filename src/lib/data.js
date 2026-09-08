export async function requireResult(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message || 'Não foi possível salvar. Tente novamente.');
  return data;
}
export async function fetchAll(makeQuery) {
  const rows = [];
  const pageSize = 100;
  for (let from = 0; ; from += pageSize) {
    const page = await requireResult(makeQuery().range(from, from + pageSize - 1));
    if (!Array.isArray(page)) throw new Error('Resposta de dados inválida.');
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
