const SNIPPETS = {
  js: {
    lang: 'JavaScript', langKey: 'js',
    title: '⚡ *Async/Await Fetch*',
    code: `async function getData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error('Fetch failed:', err.message);
    return null;
  }
}`,
  },
  py: {
    lang: 'Python', langKey: 'python',
    title: '🐍 *Decorator Pattern*',
    code: `import time
from functools import wraps

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end-start:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(0.1)`,
  },
  go: {
    lang: 'Go', langKey: 'go',
    title: '🔵 *Goroutines & Channels*',
    code: `package main

import (
  "fmt"
  "sync"
)

func worker(id int, wg *sync.WaitGroup) {
  defer wg.Done()
  fmt.Printf("Worker %d done\\n", id)
}

func main() {
  var wg sync.WaitGroup
  for i := 1; i <= 5; i++ {
    wg.Add(1)
    go worker(i, &wg)
  }
  wg.Wait()
}`,
  },
  rs: {
    lang: 'Rust', langKey: 'rust',
    title: '🦀 *Result & Error Handling*',
    code: `use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    ParseError(ParseIntError),
    NegativeNumber,
}

fn parse_positive(s: &str) -> Result<u32, AppError> {
    let n: i32 = s.parse().map_err(AppError::ParseError)?;
    if n < 0 { return Err(AppError::NegativeNumber); }
    Ok(n as u32)
}`,
  },
  ts: {
    lang: 'TypeScript', langKey: 'typescript',
    title: '🔷 *Generic Utility Types*',
    code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
};

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}`,
  },
  sql: {
    lang: 'SQL', langKey: 'sql',
    title: '🗄️ *Window Functions*',
    code: `-- Rank users by score within each department
SELECT
  name,
  department,
  score,
  RANK() OVER (
    PARTITION BY department
    ORDER BY score DESC
  ) AS dept_rank,
  AVG(score) OVER (
    PARTITION BY department
  ) AS dept_avg
FROM employees
ORDER BY department, dept_rank;`,
  },
  bash: {
    lang: 'Bash', langKey: 'bash',
    title: '🔧 *Process Monitoring*',
    code: `#!/bin/bash
# Monitor a process and restart if it dies

PROCESS="myapp"
LOG="/var/log/monitor.log"

while true; do
  if ! pgrep -x "$PROCESS" > /dev/null; then
    echo "$(date): $PROCESS died, restarting..." >> "$LOG"
    systemctl restart "$PROCESS"
  fi
  sleep 10
done`,
  },
  cpp: {
    lang: 'C++', langKey: 'cpp',
    title: '⚙️ *Smart Pointers*',
    code: `#include <memory>
#include <iostream>

struct Node {
  int val;
  std::shared_ptr<Node> next;
  Node(int v) : val(v) {}
};

int main() {
  auto head = std::make_shared<Node>(1);
  head->next = std::make_shared<Node>(2);
  head->next->next = std::make_shared<Node>(3);

  for (auto n = head; n; n = n->next)
    std::cout << n->val << " ";
}`,
  },
  css: {
    lang: 'CSS', langKey: 'css',
    title: '🎨 *Modern CSS Grid*',
    code: `/* Responsive card grid */
.grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(280px, 1fr)
  );
  gap: 1.5rem;
  padding: 2rem;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  transition: transform .2s ease;
}

.card:hover { transform: translateY(-4px); }`,
  },
  java: {
    lang: 'Java', langKey: 'java',
    title: '☕ *Builder Pattern*',
    code: `public class User {
  private final String name;
  private final String email;
  private final int age;

  private User(Builder b) {
    this.name = b.name;
    this.email = b.email;
    this.age = b.age;
  }

  public static class Builder {
    private String name, email;
    private int age;
    public Builder name(String n) { name = n; return this; }
    public Builder email(String e) { email = e; return this; }
    public Builder age(int a) { age = a; return this; }
    public User build() { return new User(this); }
  }
}`,
  },
};

export function getSnippet(lang) {
  return SNIPPETS[lang] || null;
}

export function getAvailableLangs() {
  return Object.keys(SNIPPETS);
}

export function getRandomSnippet() {
  const keys = Object.keys(SNIPPETS);
  return SNIPPETS[keys[Math.floor(Math.random() * keys.length)]];
}
