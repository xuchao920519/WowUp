﻿using Microsoft.Extensions.DependencyInjection;
using Serilog;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using WowUp.Common.Services.Contracts;
using WowUp.WPF.AddonProviders;
using WowUp.WPF.AddonProviders.Contracts;
using WowUp.WPF.Repositories;
using WowUp.WPF.Repositories.Contracts;
using WowUp.WPF.Services;
using WowUp.WPF.Services.Contracts;
using WowUp.WPF.Utilities;
using WowUp.WPF.ViewModels;
using WowUp.WPF.Views;

namespace WowUp.WPF
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private readonly ServiceProvider _serviceProvider;
        private readonly IAnalyticsService _analyticsService;

        public App()
        {
            AppDomain.CurrentDomain.UnhandledException += new UnhandledExceptionEventHandler(ExceptionHandler);
            Application.Current.DispatcherUnhandledException += Current_DispatcherUnhandledException;
            TaskScheduler.UnobservedTaskException += TaskScheduler_UnobservedTaskException;

            var logFilePath = Path.Combine(FileUtilities.AppLogsPath, "wowup-logs.txt");

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Debug()
                .WriteTo.Console()
                .WriteTo.File(logFilePath, rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
                .CreateLogger();

            Log.Information($"Starting {AppUtilities.CurrentVersion}");

            var serviceCollection = new ServiceCollection();
            ConfigureServices(serviceCollection);

            _serviceProvider = serviceCollection.BuildServiceProvider();
            _analyticsService = _serviceProvider.GetRequiredService<IAnalyticsService>();
        }

        protected override void OnStartup(StartupEventArgs e)
        {
            var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
            mainWindow.Show();
        }

        protected override void OnExit(ExitEventArgs e)
        {
            Log.CloseAndFlush();

            base.OnExit(e);
        }

        private void ConfigureServices(IServiceCollection services)
        {
            services.AddMemoryCache();

            services.AddTransient<AboutViewModel>();
            services.AddTransient<AddonListItemViewModel>();
            services.AddTransient<AddonsViewViewModel>();
            services.AddTransient<GetAddonsViewModel>();
            services.AddTransient<InstallUrlDialogViewModel>();
            services.AddTransient<MainWindowViewModel>();
            services.AddTransient<OptionsViewModel>();
            services.AddTransient<PotentialAddonListItemViewModel>();
            services.AddTransient<ApplicationUpdateControlViewModel>();

            services.AddTransient<AboutView>();
            services.AddTransient<AddonsView>();
            services.AddTransient<GetAddonsView>();
            services.AddTransient<OptionsView>();
            services.AddTransient<InstallUrlWindow>();

            services.AddTransient<ICurseAddonProvider, CurseAddonProvider>();
            services.AddTransient<IGitHubAddonProvider, GitHubAddonProvider>();
            services.AddTransient<ITukUiAddonProvider, TukUiAddonProvider>();
            services.AddTransient<ApplicationUpdater>();

            services.AddSingleton<MainWindow>();

            services.AddSingleton<IAddonService, AddonService>();
            services.AddSingleton<IWarcraftService, WarcraftService>();
            services.AddSingleton<IDownloadService, DownloadService>();
            services.AddSingleton<IWowUpService, WowUpService>();
            services.AddSingleton<IAnalyticsService, AnalyticsService>();
            services.AddSingleton<IMigrationService, MigrationService>();

            services.AddSingleton<IAddonRepository, AddonRepository>();
            services.AddSingleton<IPreferenceRepository, PreferenceRepository>();
        }

        private void TaskScheduler_UnobservedTaskException(object sender, UnobservedTaskExceptionEventArgs e)
        {
            _analyticsService.Track(e.Exception, true);
            Log.Error(e.Exception, "Uncaught Exception");
            Log.Error($"Terminating");
        }

        private void Current_DispatcherUnhandledException(object sender, System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
        {
            _analyticsService.Track(e.Exception, true);
            Log.Error(e.Exception, "Uncaught Exception");
            Log.Error($"Terminating");
        }

        private void ExceptionHandler(object sender, UnhandledExceptionEventArgs args)
        {
            Exception e = (Exception)args.ExceptionObject;
            _analyticsService.Track(e, true);

            Log.Error(e, "Uncaught Exception");
            Log.Error($"Terminating {args.IsTerminating}");
        }
    }
}
