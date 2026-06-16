import { notFound } from "next/navigation";
import { getLiveEvent } from "../../../lib/live-data";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getLiveEvent(slug);
  if (!event) notFound();
  return (
    <main className="page-shell detail-page">
      <a href="/">← 返回精选</a>
      <div className="detail-head">
        <div className="event-meta"><span className="score">{event.score}</span><span>{event.category}</span><span>{event.sources.length} 个信源</span><span>置信度 {Math.round(event.confidence * 100)}%</span></div>
        <h1>{event.title}</h1><p className="lead">{event.summary}</p>
      </div>
      <div className="detail-grid">
        <article>
          <section><span className="eyebrow">WHY IT MATTERS</span><h2>为什么重要</h2><p>{event.importance}</p></section>
          <section><span className="eyebrow">POSSIBLE IMPACT</span><h2>可能影响</h2><p>{event.impact}</p></section>
          <section><span className="eyebrow">RISKS & UNCERTAINTY</span><h2>风险与不确定性</h2><ul>{event.risks.map(risk => <li key={risk}>{risk}</li>)}</ul><p>{event.uncertainty}</p></section>
          <section><span className="eyebrow">SOURCES</span><h2>原始信源</h2>{event.sources.map(source => <a className="source-row" href={source.url} target="_blank" rel="noreferrer" key={source.id}><span><b>{source.title}</b><small>{source.sourceName} · {source.sourceType}</small></span><i>打开原文 ↗</i></a>)}</section>
        </article>
        <aside>
          <div className="aside-card"><span className="eyebrow">RELATED ASSETS</span><h3>关联资产</h3>{event.assets.map(asset => <div className="asset-row" key={asset.symbol}><span><b>{asset.name}</b><small>{asset.market} · {asset.relation}</small></span><code>{asset.symbol}</code></div>)}<p className="muted">公开行情参考，可能存在延迟，请以交易所最终数据为准。</p></div>
          <div className="aside-card"><span className="eyebrow">METHODOLOGY</span><h3>这条内容如何生成</h3><p>系统将多个公开信源聚合为同一事件，再生成事实摘要与影响提示。编辑可随时修正或撤回。</p></div>
        </aside>
      </div>
    </main>
  );
}
