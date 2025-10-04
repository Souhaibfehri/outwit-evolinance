# 🔌 API Documentation

## Server Actions

Outwit Budget uses Next.js Server Actions for secure server-side operations. All actions are located in the `/app/actions/` directory.

### 🔐 Authentication

All server actions require authentication and automatically get the current user context.

```typescript
const user = await getUserAndEnsure()
if (!user) {
  return { success: false, error: 'User not found' }
}
```

## 📊 Budget Actions (`/app/actions/budget.ts`)

### `createCategory(formData: FormData)`
Creates a new budget category.

**Parameters:**
- `name` (string): Category name
- `groupName` (string): Category group (Essentials, Lifestyle, etc.)
- `monthlyBudget` (number): Default monthly budget amount
- `rollover` (boolean): Whether unused budget carries over

**Returns:**
```typescript
{ success: boolean, message?: string, category?: Category, error?: string }
```

### `setBudgetAmount(formData: FormData)`
Sets or updates budget allocation for a category.

**Parameters:**
- `categoryId` (string): Category ID
- `amount` (number): Budget amount in dollars
- `month` (number): Target month (0-11)
- `year` (number): Target year

### `createDefaultCategories()`
Creates a set of default budget categories for new users.

## 💰 Income Actions (`/app/actions/income.ts`)

### `addRecurringIncome(formData: FormData)`
Adds a new recurring income source.

**Parameters:**
- `name` (string): Income source name
- `amount` (number): Amount per payment
- `frequency` (string): 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
- `nextDate` (string): Next payment date (ISO string)
- `active` (boolean): Whether income is active

### `addOneOffIncome(formData: FormData)`
Records a one-time income event.

**Parameters:**
- `name` (string): Income description
- `amount` (number): Income amount
- `date` (string): Income date (ISO string)
- `note` (string, optional): Additional notes

## 💳 Transaction Actions (`/app/actions/transactions.ts`)

### `createTransaction(formData: FormData)`
Creates a new transaction and updates account balances.

**Parameters:**
- `date` (string): Transaction date
- `merchant` (string): Transaction description
- `categoryId` (string, optional): Budget category ID
- `accountId` (string): Account ID
- `type` (string): 'INCOME' | 'EXPENSE' | 'TRANSFER'
- `amount` (number): Transaction amount
- `note` (string, optional): Additional notes

**Side Effects:**
- Updates account balance
- Updates budget spending if expense with category

### `importCSV(formData: FormData)`
Imports transactions from CSV file.

**Parameters:**
- `csvFile` (File): CSV file to import
- `accountId` (string): Target account ID
- `dateFormat` (string): Date format in CSV

## 🎯 Goal Actions (`/app/actions/goals.ts`)

### `addGoal(formData: FormData)`
Creates a new savings goal.

**Parameters:**
- `name` (string): Goal name
- `target` (number): Target amount
- `saved` (number, optional): Current saved amount
- `deadline` (string, optional): Target date
- `priority` (number): Priority level (1-5)
- `note` (string, optional): Additional notes

### `addMoneyToGoal(formData: FormData)`
Adds money to an existing goal.

**Parameters:**
- `id` (string): Goal ID
- `amount` (number): Amount to add

## 💳 Debt Actions (`/app/actions/debt-payoff.ts`)

### `addDebt(formData: FormData)`
Adds a new debt account.

**Parameters:**
- `name` (string): Debt name
- `balance` (number): Current balance
- `interest` (number): Interest rate (0-100%)
- `minPayment` (number, optional): Minimum monthly payment

### `calculatePayoffPlan(formData: FormData)`
Calculates debt payoff scenarios.

**Parameters:**
- `extraPayment` (number): Additional monthly payment
- `method` (string): 'avalanche' | 'snowball'

**Returns:**
```typescript
{
  success: boolean,
  payoffPlan?: {
    method: string,
    totalMonths: number,
    totalPayments: number,
    totalInterestPaid: number,
    payoffDate: string,
    monthlySchedule: PaymentSchedule[]
  },
  error?: string
}
```

## 🔔 Notification Actions (`/app/actions/notifications.ts`)

### `generateNotifications()`
Generates notifications based on current financial data.

**Notification Types:**
- `budget_warning`: When approaching/exceeding budget limits
- `goal_milestone`: When reaching goal milestones (25%, 50%, 75%, 100%)
- `bill_reminder`: Upcoming bill due dates
- `debt_alert`: High-interest debt warnings
- `income_reminder`: Upcoming income payments

### `markNotificationAsRead(formData: FormData)`
Marks a notification as read.

**Parameters:**
- `id` (string): Notification ID

## ⚙️ Settings Actions (`/app/actions/settings.ts`)

### `updateProfileSettings(formData: FormData)`
Updates user profile information.

### `updateNotificationSettings(formData: FormData)`
Updates notification preferences.

### `changePassword(formData: FormData)`
Changes user password through Supabase Auth.

### `exportUserData()`
Exports all user data as JSON.

## 📱 Data Models

### User Profile
```typescript
interface UserProfile {
  onboardingDone: boolean
  onboardingStep: number
  currency: string
  paySchedule: 'WEEKLY' | 'BIWEEKLY' | 'SEMIMONTHLY' | 'MONTHLY'
}
```

### Goal
```typescript
interface Goal {
  id: string
  name: string
  target: number // cents
  saved: number // cents
  deadline?: string
  priority: number // 1-5
  note?: string
}
```

### Debt
```typescript
interface Debt {
  id: string
  name: string
  balance: number // cents
  interest: number // percentage
  minPayment?: number // cents
}
```

### Transaction
```typescript
interface Transaction {
  id: string
  date: string
  merchant: string
  categoryId?: string
  accountId: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amountCents: number
  note?: string
}
```

## 🔒 Security

### Authentication
- **Supabase Auth** for secure user management
- **Server-side session validation** on all protected routes
- **Middleware protection** for app routes

### Data Validation
- **Zod schemas** for all form inputs
- **Server-side validation** for all user actions
- **Type safety** throughout the application

### Data Storage
- **User metadata** stored in Supabase Auth (encrypted)
- **No sensitive data** in localStorage or client-side storage
- **Secure server actions** for all data mutations

## 🚀 Performance

### Optimization Features
- **Server-side rendering** for fast initial page loads
- **Static generation** for marketing pages
- **Image optimization** with Next.js Image component
- **Code splitting** for optimal bundle sizes
- **Caching strategies** for frequently accessed data

### Monitoring
- **Real-time error tracking** with detailed error messages
- **Performance monitoring** through Next.js analytics
- **User experience tracking** for continuous improvement

## 🧪 Testing

### Test Coverage
- **Unit tests** for utility functions
- **Component tests** for React components
- **Integration tests** for server actions
- **End-to-end tests** for critical user flows

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run type-check    # TypeScript validation
```

## 📦 Deployment

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### Build Commands
```bash
npm run build    # Production build
npm start        # Start production server
npm run lint     # Code linting
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
- Ensure Supabase credentials are correct
- Use pooler connection for production
- Check SSL requirements

#### Authentication
- Verify Supabase Auth configuration
- Check middleware setup
- Ensure protected routes are properly configured

#### Build Errors
- Run `npm run type-check` for TypeScript issues
- Check for missing dependencies
- Verify environment variables

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and debugging information.

## 📈 Roadmap

### Upcoming Features
- **Bank account integration** for automatic transaction import
- **Investment tracking** with portfolio management
- **Bill automation** with payment scheduling
- **Advanced reporting** with custom date ranges
- **Mobile app** for iOS and Android
- **Team budgeting** for shared finances

### Performance Improvements
- **Database optimization** with proper indexing
- **Caching layer** for frequently accessed data
- **Progressive Web App** features
- **Offline support** for core functionality

---

**Happy budgeting! 💰**
