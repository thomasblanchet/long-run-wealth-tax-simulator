library(jsonlite)
library(haven)
library(dplyr)
library(magrittr)

load("~/Dropbox/USWealthDynamics/work-data/05-fit-model.rdata")
data <- read_dta("~/Dropbox/SaezZucman2014/RealTime/work-data/03-build-monthly-microfiles/microfiles/dina-monthly-2022m4.dta")

data <- data %>%
    # Import diffusion parameters
    mutate(wealth_norm = hweal/weighted.mean(peinc, weight)) %>%
    mutate(asinh_wealth = asinh(wealth_norm)) %>%
    mutate(wealth_bin = round(10*asinh_wealth)) %>%
    left_join(model_params %>% select(-asinh_wealth)) %>%
    left_join(model_all_data %>% filter(year == 2019) %>% select(wealth_bin, sd_income)) %>%
    mutate(sd_income = suppressWarnings(approx(x = wealth_norm, y = sd_income, xout = wealth_norm, rule = 2)$y)) %>%
    mutate(diffu_star_smooth = suppressWarnings(approx(x = wealth_norm, y = diffu_star_smooth, xout = wealth_norm, rule = 2)$y)) %>%
    mutate(conso = suppressWarnings(approx(x = wealth_norm, y = drift_corr_per2 + diffu_star_smooth*wealth_norm/sqrt(1 + wealth_norm^2), xout = wealth_norm, rule = 2)$y)) %>%
    # Calculate diffusion
    mutate(diffu = sqrt((sd_income^2 + 2*diffu_star_smooth)*(1 + wealth_norm^2))*weighted.mean(peinc, weight)) %>%
    mutate(conso = -conso*sqrt(1 + wealth_norm^2)*weighted.mean(peinc, weight)) %>%
    select(weight, hweal, diffu, conso, peinc)

national_income <- sum(data$peinc*data$weight)

data <- data %>%
    select(weight, hweal, diffu, conso) %>%
    rename(wealth = hweal) %>%
    arrange(wealth) %>%
    mutate(i = ceiling(row_number()/100)) %>%
    group_by(i) %>%
    summarise(
        wealth = weighted.mean(wealth, weight),
        diffu = weighted.mean(diffu, weight),
        conso = weighted.mean(conso, weight),
        weight = sum(weight)
    ) %>%
    select(-i)

population <- sum(data$weight)

print(national_income/population)

data <- list(
    nationalIncome = national_income,
    nationalWealth = sum(data$wealth*data$weight),
    population = population,
    wealth = data$wealth,
    weight = data$weight,
    diffusion = data$diffu,
    consumption = data$conso
)

writeLines(toJSON(data, auto_unbox = TRUE), "~/GitHub/dynamic-wealth-tax-simulator/src/wealth-data.json")
