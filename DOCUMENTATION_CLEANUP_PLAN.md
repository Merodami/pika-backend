# Documentation Cleanup Plan

## ✅ Completed Actions

### 1. Created New Structure

- ✅ Created comprehensive directory hierarchy under `/docs`
- ✅ Set up 9 main categories with subcategories
- ✅ Created main documentation index

### 2. Moved Core Documentation

- ✅ Architecture docs → `/docs/architecture/`
- ✅ Development docs → `/docs/development/`
- ✅ Deployment docs → `/docs/deployment/`
- ✅ Migration docs → `/docs/migration/`
- ✅ Service docs → `/docs/services/`

### 3. Created Index Files

- ✅ `/docs/README.md` - Main navigation
- ✅ `/docs/architecture/README.md` - Architecture index
- ✅ `/docs/development/README.md` - Development index

## 🔄 Next Steps

### 1. Move Remaining Documentation

#### From Root Level

- [ ] Move `FIX_ALL_PATHS.md` → `/docs/development/troubleshooting/path-fixes.md`
- [ ] Move `FIX_REDIS_MULTIPLE_CONNECTIONS.md` → `/docs/development/troubleshooting/redis-connections.md`
- [ ] Move `ToDo.md` → `/docs/migration/current/todo.md`
- [ ] Move `PIKA.md` → `/docs/reference/project-overview.md`

#### From docs/active-work/

- [ ] Move `ENUM_STANDARDIZATION.md` → `/docs/development/standards/enum-standardization.md`
- [ ] Move `SDK_INTEGRATION_ISSUE.md` → `/docs/development/troubleshooting/sdk-integration.md`
- [ ] Move `SIMPLE_MULTI_LANGUAGE_PLAN.md` → `/docs/implementation/features/multi-language-plan.md`

#### From docs/ai/new/

Keep only the most recent and relevant:

- [ ] Move recent implementation guides → `/docs/implementation/`
- [ ] Move current architecture docs → `/docs/architecture/`
- [ ] Archive the rest in `/docs/archive/ai/`

### 2. Consolidate Service Documentation

Each service should have ONE comprehensive doc in `/docs/services/`:

- [ ] Consolidate Auth service docs
- [ ] Consolidate Payment service docs
- [ ] Consolidate Voucher service docs
- [ ] Consolidate Communication service docs

### 3. Clean Up Package READMEs

Standardize all `/packages/*/README.md` files to contain only:

- Service purpose (1-2 sentences)
- Key endpoints
- Environment variables
- Testing commands
- Link to main documentation

### 4. Delete/Archive Outdated Documentation

#### To Archive (move to `/docs/archive/`)

- `docs/ai/old/` - Old AI analyses
- `docs/others/pika-old/` - Old project docs
- `docs/previous-architecture/` - Previous architecture

#### To Delete

- Empty README.md files in test directories
- Duplicate Flutter documentation
- Generated documentation that can be regenerated
- Old migration guides from June-July 2024

### 5. Create Missing Documentation

#### High Priority

- [ ] `/docs/architecture/system-design/overview.md` - System overview
- [ ] `/docs/deployment/environments/vercel.md` - Vercel deployment guide
- [ ] `/docs/api/design/rest-principles.md` - REST API principles
- [ ] `/docs/testing/strategies/integration-testing.md` - Integration testing guide

#### Medium Priority

- [ ] `/docs/reference/configurations/environment-variables.md` - All env vars
- [ ] `/docs/reference/specifications/openapi.yaml` - OpenAPI spec
- [ ] `/docs/implementation/integrations/stripe.md` - Stripe integration

## 📊 Documentation Metrics

### Before Cleanup

- **Total Files**: 240+ markdown files
- **Duplicate Content**: ~40%
- **Outdated Content**: ~30%
- **Organization**: Scattered across 50+ directories

### After Cleanup (Target)

- **Total Files**: ~80 focused documents
- **Duplicate Content**: <5%
- **Outdated Content**: 0%
- **Organization**: 9 main categories with clear hierarchy

## 🗓️ Timeline

### Phase 1 (Immediate) - ✅ Complete

- Create new structure
- Move critical documentation
- Create index files

### Phase 2 (Day 1)

- Move remaining active documentation
- Consolidate service docs
- Archive old AI docs

### Phase 3 (Day 2)

- Standardize package READMEs
- Delete outdated content
- Create missing high-priority docs

### Phase 4 (Day 3)

- Final review and cleanup
- Update all cross-references
- Generate documentation site

## 📝 Notes

### Keep These Files

- `CLAUDE.md` - AI assistant context (root level)
- `CHANGELOG.md` - Version history (root level)
- `CONTRIBUTING.md` - Contribution guide (root level)
- `SECURITY.md` - Security policies (root level)
- `README.md` - Main project README (root level)

### Documentation Principles

1. **One source of truth** - No duplicate documentation
2. **Clear hierarchy** - Easy to navigate
3. **Up-to-date** - Remove outdated content
4. **Comprehensive** - Cover all important topics
5. **Maintainable** - Easy to update

### Quality Checks

- [ ] All links work
- [ ] No duplicate content
- [ ] Consistent formatting
- [ ] Clear navigation
- [ ] Updated dates on all files

---

_Created: 2024-08-13_
