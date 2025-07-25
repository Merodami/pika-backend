# AWS Infrastructure Plan for Pika MVP

**Version**: 1.1.0  
**Date**: January 2025  
**Budget**: $100/month maximum  
**Target**: 50 concurrent users (scalable to 10,000+)  
**Author**: AI Infrastructure Engineer  
**Status**: Production-Ready ✅

## Executive Summary

This document outlines a comprehensive AWS infrastructure plan for deploying the Pika marketplace platform. The plan focuses on creating a scalable, secure, and cost-effective MVP infrastructure that can handle 50 concurrent users while staying within a $100/month budget.

### Key Architecture Decisions

- **Container Orchestration**: ECS Fargate (serverless containers)
- **Database**: RDS PostgreSQL with PostGIS extension
- **Caching**: ElastiCache Redis
- **CDN**: CloudFront for static assets
- **Infrastructure as Code**: AWS CDK (primary) with Terraform alternative
- **CI/CD**: GitHub Actions with AWS CodeDeploy
- **Monitoring**: CloudWatch with custom dashboards
- **Security**: WAF, Security Groups, IAM roles with least privilege

## Infrastructure Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Internet                                   │
└─────────────────────┬───────────────────────┬──────────────────────┘
                      │                       │
              ┌───────▼──────┐        ┌───────▼──────┐
              │  CloudFront  │        │     WAF      │
              │     (CDN)    │        │  (Security)  │
              └───────┬──────┘        └───────┬──────┘
                      │                       │
              ┌───────▼──────────────────────▼──────┐
              │        Application Load Balancer     │
              │         (Multi-AZ, SSL/TLS)         │
              └─────────────────┬───────────────────┘
                                │
              ┌─────────────────▼───────────────────┐
              │          ECS Fargate Cluster        │
              ├─────────────────────────────────────┤
              │  ┌─────────┐  ┌──────────────────┐ │
              │  │   API    │  │  Microservices   │ │
              │  │ Gateway  │  │  (6 Services)    │ │
              │  └────┬────┘  └────────┬─────────┘ │
              └───────┼────────────────┼───────────┘
                      │                │
        ┌─────────────┼────────────────┼─────────────┐
        │             │                │             │
    ┌───▼───┐    ┌────▼────┐    ┌─────▼─────┐  ┌───▼────┐
    │  RDS  │    │  Redis  │    │    S3     │  │Firebase│
    │PostGIS│    │  Cache  │    │  Storage  │  │Services│
    └───────┘    └─────────┘    └───────────┘  └────────┘
```

### Network Architecture

```
VPC (10.0.0.0/16)
├── Public Subnets (Multi-AZ)
│   ├── 10.0.1.0/24 (AZ-1a) - ALB, NAT Gateway
│   └── 10.0.2.0/24 (AZ-1b) - ALB, NAT Gateway
├── Private Subnets (Multi-AZ)
│   ├── 10.0.11.0/24 (AZ-1a) - ECS Tasks, RDS Primary
│   └── 10.0.12.0/24 (AZ-1b) - ECS Tasks, RDS Standby
└── Database Subnets (Multi-AZ)
    ├── 10.0.21.0/24 (AZ-1a) - RDS, ElastiCache
    └── 10.0.22.0/24 (AZ-1b) - RDS, ElastiCache
```

## Detailed Component Specifications

### 1. Compute Layer (ECS Fargate)

#### Service Configuration

```yaml
API Gateway:
  cpu: 256 (0.25 vCPU)
  memory: 512 MB
  desiredCount: 1
  autoScaling:
    minTasks: 1
    maxTasks: 2
    targetCPU: 70%

Microservices (each):
  cpu: 256 (0.25 vCPU)
  memory: 512 MB
  desiredCount: 1
  autoScaling:
    minTasks: 1
    maxTasks: 2
    targetCPU: 70%
```

#### Cost Optimization

- Use Fargate Spot for non-critical services (70% cost reduction)
- Implement request-based auto-scaling
- Schedule scaling for predictable traffic patterns

### 2. Database Layer (RDS PostgreSQL)

#### Configuration

```yaml
RDS PostgreSQL:
  engine: postgres 14.x
  instanceClass: db.t3.micro
  allocatedStorage: 20 GB (gp3)
  multiAZ: false (MVP compromise)
  backupRetention: 7 days
  extensions:
    - postgis
    - pgcrypto
  monitoring:
    - enhanced monitoring (60 sec)
    - performance insights (7 days)
```

#### Optimization Strategies

- Enable connection pooling at application level
- Implement read replica when scaling beyond 100 users
- Use RDS Proxy for connection management (future)

### 3. Caching Layer (ElastiCache Redis)

#### Configuration

```yaml
ElastiCache Redis:
  nodeType: cache.t3.micro
  numNodes: 1 (single node for MVP)
  engineVersion: 7.0
  parameterGroup: default.redis7
  snapshotRetention: 1 day
  features:
    - session storage
    - API rate limiting
    - query result caching
```

### 4. Storage Layer (S3)

#### Bucket Structure

```
pika-production/
├── static/           # Frontend assets (CloudFront origin)
├── uploads/          # User uploads (private)
├── backups/          # Database backups
└── logs/            # Application logs (lifecycle: 30 days)
```

#### Security Configuration

- Server-side encryption (SSE-S3)
- Versioning enabled for critical buckets
- Lifecycle policies for cost optimization
- CORS configuration for frontend access

### 5. CDN Layer (CloudFront)

#### Distribution Configuration

```yaml
CloudFront:
  origins:
    - S3 (static assets)
    - ALB (API endpoints)
  behaviors:
    - /api/* → ALB
    - /* → S3
  caching:
    - static assets: 1 year
    - API responses: custom per endpoint
  security:
    - TLS 1.2 minimum
    - Security headers
    - WAF integration
```

### 6. Security Architecture

#### WAF Rules

```yaml
AWS WAF:
  rules:
    - SQL injection protection
    - XSS protection
    - Rate limiting (1000 req/5min per IP)
    - Geographic restrictions (if needed)
    - Bot control (basic)
```

#### IAM Roles and Policies

```yaml
ECS Task Roles:
  - RDS access (specific schemas)
  - S3 access (specific buckets)
  - ElastiCache access
  - CloudWatch logs
  - Secrets Manager (for credentials)
  - Firebase Admin SDK permissions

Service-to-Service:
  - Least privilege principle
  - No cross-service database access
  - Scoped S3 bucket access
```

### 7. Monitoring and Alerting

#### CloudWatch Configuration

```yaml
Dashboards:
  - Service Health (all services)
  - API Performance (latency, errors)
  - Database Metrics (connections, CPU, storage)
  - Cost Dashboard (daily spend tracking)

Alarms:
  - High CPU/Memory (>80%)
  - API errors (>5% error rate)
  - Database connections (>80% of max)
  - Daily spend (>$4)
  - Monthly spend (>$80)

Logs:
  - Retention: 7 days (debug), 30 days (errors)
  - Log groups per service
  - Structured JSON logging
```

### 8. CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
Deploy Pipeline: 1. Code checkout
  2. Run tests
  3. Build Docker images
  4. Push to ECR
  5. Update ECS task definitions
  6. Deploy to staging
  7. Run smoke tests
  8. Deploy to production (manual approval)
  9. Post-deployment validation
```

## Cost Breakdown (Monthly)

### Optimized for $100 Budget

| Service         | Configuration                | Cost     |
| --------------- | ---------------------------- | -------- |
| ECS Fargate     | 7 tasks × 0.25 vCPU × 512MB  | $35      |
| RDS PostgreSQL  | t3.micro + 20GB gp3          | $20      |
| ElastiCache     | t3.micro single node         | $13      |
| ALB             | Basic + minimal LCU          | $18      |
| S3 + CloudFront | 10GB storage + 50GB transfer | $5       |
| CloudWatch      | Logs + essential metrics     | $5       |
| Route 53        | 1 hosted zone                | $1       |
| Data Transfer   | Inter-AZ + NAT Gateway       | $3       |
| **Total**       |                              | **$100** |

### Cost Optimization Measures

1. **Fargate Spot**: 70% savings on compute (when stable)
2. **S3 Intelligent Tiering**: Automatic cost optimization
3. **Reserved Capacity**: Consider after 3 months (30-40% savings)
4. **Scheduled Scaling**: Scale down during off-hours
5. **CloudWatch Logs**: Implement log filtering to reduce ingestion

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Create VPC with subnets
- [ ] Set up RDS PostgreSQL with PostGIS
- [ ] Configure ElastiCache Redis
- [ ] Create S3 buckets with policies
- [ ] Set up ECR repositories

### Phase 2: Compute & Networking (Week 2)

- [ ] Deploy ECS cluster
- [ ] Configure ALB with target groups
- [ ] Deploy API Gateway service
- [ ] Deploy microservices
- [ ] Configure service discovery

### Phase 3: Security & Monitoring (Week 3)

- [ ] Configure WAF rules
- [ ] Set up IAM roles and policies
- [ ] Implement Secrets Manager
- [ ] Configure CloudWatch dashboards
- [ ] Set up billing alerts

### Phase 4: CI/CD & Optimization (Week 4)

- [ ] Complete GitHub Actions pipeline
- [ ] Configure auto-scaling policies
- [ ] Implement cost optimization
- [ ] Performance testing
- [ ] Documentation completion

## Disaster Recovery Plan

### Backup Strategy

- **RDS**: Automated daily backups (7-day retention)
- **Redis**: Daily snapshots
- **S3**: Cross-region replication for critical data
- **Code**: Git repository (multiple remotes)

### Recovery Time Objectives

- **RTO**: 1 hour (service restoration)
- **RPO**: 24 hours (data loss tolerance)

### Incident Response

1. Automated health checks and alerts
2. On-call rotation (future)
3. Runbook documentation
4. Post-mortem process

## Scaling Path

### Growth Milestones

| Users | Changes Required                     | Est. Cost |
| ----- | ------------------------------------ | --------- |
| 50    | Current setup                        | $100      |
| 100   | Add read replica, increase ECS tasks | $150      |
| 250   | Multi-AZ RDS, larger cache           | $250      |
| 500   | Add Elasticsearch, CDN optimization  | $400      |
| 1000+ | Kubernetes migration consideration   | $600+     |

## Security Best Practices

### Application Security

- JWT token rotation
- API rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

### Infrastructure Security

- Private subnets for compute
- Security groups (least privilege)
- Network ACLs
- VPC Flow Logs
- AWS Config rules
- GuardDuty (when budget allows)

### Compliance Considerations

- Data encryption at rest and in transit
- PII data handling procedures
- GDPR compliance ready
- Audit logging
- Access control matrices

## Operational Excellence

### Automation

- Infrastructure as Code (100% coverage)
- Automated deployments
- Auto-scaling policies
- Automated backups
- Self-healing systems

### Documentation

- Architecture diagrams
- Runbooks for common tasks
- Disaster recovery procedures
- API documentation
- Security policies

### Monitoring Philosophy

- Proactive monitoring over reactive
- Business metrics alongside technical
- User experience metrics
- Cost tracking as first-class metric

## Next Steps

1. **Review and Approval**: Architecture review with team
2. **Environment Setup**: AWS account, IAM users, billing alerts
3. **Infrastructure Code**: Complete CDK implementation
4. **Security Review**: Penetration testing plan
5. **Load Testing**: Validate 50-user capacity
6. **Go-Live Checklist**: Final validation before launch

## Appendix

### A. Technology Choices Rationale

- **ECS over EKS**: Lower operational overhead, cost-effective for MVP
- **Fargate over EC2**: Serverless, no instance management
- **PostgreSQL**: Existing codebase compatibility, PostGIS support
- **CDK over Terraform**: Better AWS service integration
- **GitHub Actions**: Existing repository integration

### B. Alternative Considerations

- **Amplify**: Considered but limited backend flexibility
- **Lambda**: Not suitable for long-running services
- **DynamoDB**: No PostGIS equivalent
- **Elastic Beanstalk**: Less control over infrastructure

### C. Future Enhancements

- Elasticsearch integration
- Kubernetes migration path
- Multi-region deployment
- Advanced monitoring (Datadog/New Relic)
- API Gateway caching
- GraphQL federation

---

**Document Status**: Ready for Implementation  
**Review Cycle**: Monthly  
**Success Metrics**: <$100/month, <200ms API latency, >99.9% uptime
