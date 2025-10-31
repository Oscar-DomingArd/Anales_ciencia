<?php

namespace TDW\ACiencia\Factory;

use DateTime;
use TDW\ACiencia\Entity\Association;

interface AssociationFactoryInterface
{
    /** crea una asociacion valida
     *
     *  @param non-empty-string $name
     *  @param non-empty-string $website
     * @param DateTime|null $birthDate
     * @param DateTime|null $deathDate
     * @param string|null $imageUrl
     * @param string|null $wikiUrl
     *
     * @return Association
     */
    public static function createAssociation(
        string $name,
        string $website,
        ?DateTime $birthDate = null,
        ?DateTime $deathDate = null,
        ?string $imageUrl = null,
        ?string $wikiUrl = null,
    ): Association;
}