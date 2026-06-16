import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">财</span>
        <span>财讯雷达</span>
      </Link>
      <nav>
        <Link href="/">精选</Link>
        <Link href="/all">全部动态</Link>
        <Link href="/daily">每日简报</Link>
        <Link href="/sources">信源提报</Link>
        <Link href="/about">关于</Link>
        <Link href="/changelog">更新日志</Link>
        <Link href="/feedback">反馈</Link>
        <Link href="/admin">管理后台</Link>
      </nav>
      <form action="/search" className="header-search">
        <input name="q" placeholder="搜索公司、行业或事件" aria-label="搜索财经热点" />
        <button type="submit">搜索</button>
      </form>
    </header>
  );
}
