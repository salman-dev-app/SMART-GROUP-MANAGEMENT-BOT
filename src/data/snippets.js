/**
 * Code snippets for common patterns and languages
 */
export const CODE_SNIPPETS = {
  js: {
    label: 'JavaScript',
    snippets: [
      {
        title: '🔄 Async/Await Fetch',
        code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}`
      },
      {
        title: '📦 Debounce Function',
        code: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage: const debouncedSearch = debounce(search, 300);`
      },
      {
        title: '🔒 Deep Clone Object',
        code: `// Method 1: structuredClone (modern)
const clone = structuredClone(obj);

// Method 2: JSON parse/stringify (no functions/dates)
const clone2 = JSON.parse(JSON.stringify(obj));

// Method 3: Recursive deep clone
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
}`
      }
    ]
  },

  py: {
    label: 'Python',
    snippets: [
      {
        title: '🌐 HTTP Request with retry',
        code: `import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3),
       wait=wait_exponential(multiplier=1, min=4, max=10))
async def fetch_with_retry(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        return response.json()`
      },
      {
        title: '🎯 Dataclass with validation',
        code: `from dataclasses import dataclass, field
from typing import Optional
import re

@dataclass
class User:
    name: str
    email: str
    age: int = 0
    tags: list = field(default_factory=list)

    def __post_init__(self):
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', self.email):
            raise ValueError(f'Invalid email: {self.email}')
        if self.age < 0:
            raise ValueError('Age must be non-negative')`
      },
      {
        title: '⚡ Context Manager',
        code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label=""):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{label}: {elapsed:.4f}s")

# Usage:
# with timer("database query"):
#     result = db.query(...)`
      }
    ]
  },

  go: {
    label: 'Go',
    snippets: [
      {
        title: '🚀 HTTP Server with middleware',
        code: `package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    }
}

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "Hello, World!")
}

func main() {
    http.HandleFunc("/", loggingMiddleware(handler))
    log.Fatal(http.ListenAndServe(":8080", nil))
}`
      },
      {
        title: '📊 Goroutine with WaitGroup',
        code: `package main

import (
    "fmt"
    "sync"
)

func worker(id int, wg *sync.WaitGroup, results chan<- int) {
    defer wg.Done()
    // Simulate work
    results <- id * id
}

func main() {
    var wg sync.WaitGroup
    results := make(chan int, 5)

    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go worker(i, &wg, results)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    for result := range results {
        fmt.Println(result)
    }
}`
      }
    ]
  },

  rs: {
    label: 'Rust',
    snippets: [
      {
        title: '⚡ Async HTTP with Tokio',
        code: `use reqwest::Error;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Debug)]
struct Post {
    id: u32,
    title: String,
    body: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let posts: Vec<Post> = reqwest::get(
        "https://jsonplaceholder.typicode.com/posts"
    )
    .await?
    .json()
    .await?;

    for post in &posts[..3] {
        println!("{}: {}", post.id, post.title);
    }
    Ok(())
}`
      },
      {
        title: '🔒 Error handling with Result',
        code: `use std::num::ParseIntError;
use thiserror::Error;

#[derive(Error, Debug)]
enum AppError {
    #[error("Parse error: {0}")]
    Parse(#[from] ParseIntError),
    #[error("Validation error: {0}")]
    Validation(String),
}

fn parse_positive(s: &str) -> Result<u32, AppError> {
    let n: i32 = s.parse()?;
    if n < 0 {
        return Err(AppError::Validation(
            format!("{} is negative", n)
        ));
    }
    Ok(n as u32)
}`
      }
    ]
  },

  ts: {
    label: 'TypeScript',
    snippets: [
      {
        title: '🎯 Generic Repository Pattern',
        code: `interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

class UserRepository implements Repository<User, number> {
  private users: Map<number, User> = new Map();

  async findById(id: number): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: number): Promise<void> {
    this.users.delete(id);
  }
}`
      },
      {
        title: '🔧 Zod Validation Schema',
        code: `import { z } from 'zod';

const UserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
  role: z.enum(['admin', 'user', 'moderator']),
  metadata: z.record(z.unknown()).optional(),
});

type User = z.infer<typeof UserSchema>;

function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}`
      }
    ]
  },

  java: {
    label: 'Java',
    snippets: [
      {
        title: '🏭 Builder Pattern',
        code: `public class DatabaseConfig {
    private final String host;
    private final int port;
    private final String database;
    private final int maxPoolSize;

    private DatabaseConfig(Builder builder) {
        this.host = builder.host;
        this.port = builder.port;
        this.database = builder.database;
        this.maxPoolSize = builder.maxPoolSize;
    }

    public static class Builder {
        private String host = "localhost";
        private int port = 5432;
        private String database;
        private int maxPoolSize = 10;

        public Builder host(String host) {
            this.host = host; return this;
        }
        public Builder port(int port) {
            this.port = port; return this;
        }
        public Builder database(String db) {
            this.database = db; return this;
        }
        public Builder maxPoolSize(int size) {
            this.maxPoolSize = size; return this;
        }
        public DatabaseConfig build() {
            return new DatabaseConfig(this);
        }
    }
}`
      }
    ]
  },

  cpp: {
    label: 'C++',
    snippets: [
      {
        title: '🔒 RAII Resource Management',
        code: `#include <iostream>
#include <memory>
#include <vector>

class DatabaseConnection {
public:
    DatabaseConnection(const std::string& url) : url_(url) {
        std::cout << "Connecting to " << url_ << "\\n";
        // connect...
    }

    ~DatabaseConnection() {
        std::cout << "Closing connection\\n";
        // cleanup...
    }

    // Delete copy, allow move
    DatabaseConnection(const DatabaseConnection&) = delete;
    DatabaseConnection& operator=(const DatabaseConnection&) = delete;
    DatabaseConnection(DatabaseConnection&&) = default;

    void query(const std::string& sql) {
        std::cout << "Executing: " << sql << "\\n";
    }

private:
    std::string url_;
};

int main() {
    auto db = std::make_unique<DatabaseConnection>("localhost:5432");
    db->query("SELECT 1");
    // Auto-cleanup when out of scope
}`
      }
    ]
  },

  sql: {
    label: 'SQL',
    snippets: [
      {
        title: '📊 Window Functions',
        code: `-- Ranking with partitions
SELECT
    employee_id,
    name,
    department,
    salary,
    RANK() OVER (
        PARTITION BY department
        ORDER BY salary DESC
    ) AS dept_rank,
    LAG(salary, 1) OVER (
        PARTITION BY department
        ORDER BY salary
    ) AS prev_salary,
    salary - LAG(salary, 1) OVER (
        PARTITION BY department
        ORDER BY salary
    ) AS salary_increase
FROM employees
ORDER BY department, dept_rank;`
      },
      {
        title: '🔄 CTE with Recursive Query',
        code: `-- Organizational hierarchy
WITH RECURSIVE org_tree AS (
    -- Base case: top-level managers
    SELECT id, name, manager_id, 0 AS level,
           name::text AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case: employees with managers
    SELECT e.id, e.name, e.manager_id,
           ot.level + 1,
           ot.path || ' > ' || e.name
    FROM employees e
    JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT level, path
FROM org_tree
ORDER BY path;`
      }
    ]
  },

  bash: {
    label: 'Bash',
    snippets: [
      {
        title: '🔧 Script template with error handling',
        code: [
          '#!/usr/bin/env bash',
          'set -euo pipefail',
          '',
          '# Script metadata',
          'readonly SCRIPT_NAME="$(basename "$0")"',
          'readonly LOG_FILE="/tmp/script.log"',
          '',
          '# Logging helpers',
          'log()   { echo "[$(date +%F\\ %T)] $*" | tee -a "$LOG_FILE"; }',
          'error() { log "ERROR: $*" >&2; exit 1; }',
          'warn()  { log "WARN: $*"; }',
          '',
          '# Cleanup on exit',
          'cleanup() { log "Script exiting with code: $?"; }',
          'trap cleanup EXIT',
          '',
          '# Check dependencies',
          'check_deps() {',
          '    for dep in "$@"; do',
          '        command -v "$dep" &>/dev/null || error "$dep not found"',
          '    done',
          '}',
          '',
          'check_deps curl jq git',
          'log "All dependencies found. Starting..."',
        ].join('\n')
      }
    ]
  },

  css: {
    label: 'CSS',
    snippets: [
      {
        title: '🎨 Modern CSS utilities',
        code: `/* Container queries */
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}

/* CSS custom properties with fallbacks */
:root {
  --color-primary: hsl(220 90% 56%);
  --color-surface: hsl(0 0% 100%);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --radius: 0.5rem;
}

/* Modern centering */
.center {
  display: grid;
  place-items: center;
}

/* Fluid typography */
.fluid-text {
  font-size: clamp(1rem, 2.5vw, 2rem);
  line-height: 1.5;
}

/* Smooth scrolling + reduced motion respect */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root { --color-surface: hsl(220 15% 10%); }
}`
      }
    ]
  }
};

export function getSnippet(lang) {
  const entry = CODE_SNIPPETS[lang.toLowerCase()];
  if (!entry) return null;

  // Pick a random snippet from the language
  const snippet = entry.snippets[Math.floor(Math.random() * entry.snippets.length)];
  return {
    lang: entry.label,
    title: snippet.title,
    code: snippet.code,
    langKey: lang.toLowerCase()
  };
}

export function getAvailableLangs() {
  return Object.entries(CODE_SNIPPETS).map(([key, val]) => `\`${key}\` (${val.label})`);
}
