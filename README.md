# Wellbore Navigator

An advanced wellbore analysis and design platform for oil and gas engineering, built with Next.js and modern web technologies.

## 🚀 Features

### Core Modules
- **Nodal Analysis**: Comprehensive wellbore performance analysis
- **Wellbore Design**: Advanced wellbore design and optimization tools
- **IPR Calculations**: Inflow Performance Relationship analysis
- **PVT Analysis**: Pressure-Volume-Temperature fluid property calculations
- **Hydraulics Modeling**: Multiphase flow calculations using industry-standard correlations

### Key Capabilities
- **Pressure Profile Analysis**: Calculate pressure drops across wellbore segments
- **Flow Pattern Recognition**: Identify flow regimes in multiphase systems
- **Fluid Property Modeling**: Advanced PVT correlations for oil, gas, and water
- **Sensitivity Analysis**: Parameter optimization and sensitivity studies
- **Interactive Visualizations**: Real-time charts and graphs using Plotly.js
- **Data Management**: Import/export capabilities with Excel integration

### Technical Features
- **Modern UI**: Built with Radix UI components and Tailwind CSS
- **Dark/Light Theme**: System-aware theme switching
- **Responsive Design**: Mobile-friendly interface
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized with Next.js 15 and React 18

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.3
- **Runtime**: Node.js 22.16
- **Language**: TypeScript
- **UI Components**: Radix UI, Mantine
- **Styling**: Tailwind CSS
- **Charts**: Plotly.js, Recharts
- **Canvas**: Konva.js for interactive graphics
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **File Processing**: XLSX for Excel integration

## 📋 Prerequisites

- Node.js 22.16 or higher
- npm or yarn package manager
- Modern web browser with JavaScript enabled

## 🚀 Quick Start

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nodal
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3101`

### Available Scripts

- `npm run dev` - Start development server on port 3101
- `npm run build` - Build the application for production
- `npm run start` - Start production server on port 3101
- `npm run lint` - Run ESLint for code quality
- `npm run typecheck` - Run TypeScript type checking

## 🐳 Docker Deployment

The project includes Docker support for easy deployment. See [DOCKER.md](./DOCKER.md) for detailed instructions.

### Quick Docker Setup

1. Build the Docker image:
```bash
docker build -t nodal:latest .
```

2. Run the container:
```bash
docker run -p 3101:3101 nodal:latest
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── dashboard/         # Main application dashboard
│   │   ├── nodal-modules/ # Core analysis modules
│   │   └── admin/         # Administrative features
│   └── (auth)/           # Authentication pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── custom/           # Custom application components
├── core/                 # Core business logic
│   └── nodal-modules/    # Module-specific logic
├── services/             # API service layer
├── actions/              # Server actions
├── lib/                  # Utility libraries
├── hooks/                # Custom React hooks
├── store/                # State management
└── types/                # TypeScript type definitions
```

## 🔧 Configuration

The application uses various configuration files:

- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - UI components configuration

## 🎯 Usage

### Nodal Analysis
1. Navigate to the Nodal Analysis module
2. Input well parameters (rates, pressures, fluid properties)
3. Configure calculation methods and correlations
4. Run analysis and review results
5. Export data or generate reports

### Wellbore Design
1. Access the Wellbore Design module
2. Define wellbore geometry and pipe segments
3. Set fluid properties and operating conditions
4. Perform hydraulics calculations
5. Optimize design parameters

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For technical support or questions about the application, please contact the development team.

---

**Built with ❤️ for the oil and gas industry**